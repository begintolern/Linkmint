// lib/auth/options.ts
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyPin } from "@/lib/pin";

export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,

  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    }),

    // Username/Password login
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;

        const email = String(creds.email).trim().toLowerCase();
        const pw = String(creds.password);

        const user = await prisma.user.findFirst({
          where: { email, deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            emailVerifiedAt: true,
            referralCode: true,
            deletedAt: true,
          },
        });

        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(pw, user.password);
        if (!ok) return null;

        if (!user.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (user.deletedAt) {
          return null;
        }

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          role: user.role ?? "USER",
          referralCode: user.referralCode ?? null,
        } as any;
      },
    }),

    // PIN (per-device) login
    CredentialsProvider({
      id: "pin",
      name: "PIN",
      credentials: {
        deviceId: { label: "Device ID", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(creds) {
        const deviceId = String(creds?.deviceId || "").trim();
        const pin = String(creds?.pin || "").trim();
        if (!deviceId || !pin) return null;

        const cred = await prisma.pinCredential.findFirst({
          where: { deviceId },
          select: { userId: true, pinHash: true },
        });
        if (!cred) return null;

        const ok = await verifyPin(pin, cred.pinHash);
        if (!ok) return null;

        const user = await prisma.user.findUnique({
          where: { id: cred.userId },
          select: { id: true, email: true, name: true, role: true, referralCode: true, deletedAt: true },
        });
        if (!user || user.deletedAt) return null;

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          role: user.role ?? "USER",
          referralCode: user.referralCode ?? null,
        } as any;
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user }: { user: any }) {
      if (!user?.id) return false;
      try {
        const db = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { deletedAt: true },
        });
        if (db?.deletedAt) {
          return false;
        }
      } catch {
        return false;
      }
      return true;
    },

    async jwt({ token, user }: { token: JWT; user?: any }): Promise<JWT> {
      if (user) {
        token.sub = (user.id ?? token.sub) as string;
        (token as any).email = user.email ?? (token as any).email;
      }

      const userId = (user?.id ?? token.sub) as string | undefined;
      if (userId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true, role: true, deletedAt: true },
          });
          if (dbUser) {
            (token as any).referralCode = dbUser.referralCode ?? null;
            (token as any).role = dbUser.role ?? (token as any).role ?? "USER";
            (token as any).deletedAt = dbUser.deletedAt ?? null;
          }
        } catch {
          // ignore DB error
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session?.user) {
        (session.user as any).id = (token.sub ?? "") as string;
        (session.user as any).role = ((token as any).role ?? "USER") as string;
        (session.user as any).referralCode = ((token as any).referralCode ?? null) as string | null;
        (session.user as any).disabled = Boolean((token as any).deletedAt ?? false);
      }
      return session;
    },
  },
};

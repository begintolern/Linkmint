// lib/auth/options.ts
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,

  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
      maxAge: 60 * 60,
    }),
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

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            emailVerifiedAt: true,
            referralCode: true,
          },
        });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(pw, user.password);
        if (!ok) return null;
        if (!user.emailVerifiedAt) throw new Error("EMAIL_NOT_VERIFIED");

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

  pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }): Promise<JWT> {
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        (token as any).role =
          (user as any).role ?? (token as any).role ?? "USER";
        (token as any).referralCode =
          (user as any).referralCode ?? (token as any).referralCode ?? null;
      }
      return token;
    },

    // <-- Always hydrate referralCode from DB on each session fetch
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session?.user) {
        const userId = (token.sub ?? "") as string;
        (session.user as any).id = userId;
        (session.user as any).role = ((token as any).role ?? "USER") as string;

        try {
          const db = userId
            ? await prisma.user.findUnique({
                where: { id: userId },
                select: { referralCode: true },
              })
            : null;
          (session.user as any).referralCode = db?.referralCode ?? null;
        } catch {
          (session.user as any).referralCode = null;
        }
      }
      return session;
    },
  },
} as any;

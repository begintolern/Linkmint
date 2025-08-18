// app/api/auth/[...nextauth]/options.ts
import CredentialsProvider from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        if (!creds?.email || !creds?.password) return null;

        const email = String(creds.email).trim().toLowerCase();
        const pw = String(creds.password);

        // ✅ Select the timestamp field that actually exists in your schema
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            emailVerifiedAt: true, // <-- this is the correct field
          },
        });

        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(pw, user.password);
        if (!ok) return null;

        // ✅ Block login until verified timestamp exists
        if (!user.emailVerifiedAt) {
          // NextAuth will surface this as ?error=EMAIL_NOT_VERIFIED
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          role: (user as any).role ?? "USER",
        } as any;
      },
    }),
  ],

  pages: { signIn: "/login" },

  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: AdapterUser | null;
    }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role ?? "USER";
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }) {
      if (session.user && (token as any)?.id) {
        (session.user as any).id = (token as any).id as string;
      }
      if (session.user && (token as any)?.role) {
        (session.user as any).role = (token as any).role as string;
      }
      return session;
    },
  },
} as const;

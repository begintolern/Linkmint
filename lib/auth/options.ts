// lib/auth/options.ts
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
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
            emailVerifiedAt: true, // keep only if this exists in your schema
          },
        });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(pw, user.password);
        if (!ok) return null;

        if (!user.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          role: user.role ?? "USER",
        } as any;
      },
    }),
  ],

  pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }): Promise<JWT> {
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        (token as any).role = (user as any).role ?? (token as any).role ?? "USER";
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session?.user) {
        (session.user as any).id = (token.sub ?? "") as string;
        (session.user as any).role = ((token as any).role ?? "USER") as string;
      }
      return session;
    },
  },
} as any; // <-- cast once to avoid version/type mismatches

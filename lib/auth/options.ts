// lib/auth/options.ts
// lib/auth/options.ts
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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
        token.sub = user.id ?? token.sub;
        (token as any).email = user.email ?? (token as any).email;
      }

      const userId = (user?.id ?? token.sub) as string | undefined;
      if (userId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true, role: true },
          });
          if (dbUser) {
            (token as any).referralCode = dbUser.referralCode ?? null;
            (token as any).role = dbUser.role ?? (token as any).role ?? "USER";
          }
        } catch {
          // leave token fields as-is on DB error
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session?.user) {
        (session.user as any).id = (token.sub ?? "") as string;
        (session.user as any).role = ((token as any).role ?? "USER") as string;
        (session.user as any).referralCode = ((token as any).referralCode ?? null) as string | null;
      }
      return session;
    },
  },
};

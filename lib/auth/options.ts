// lib/auth/options.ts
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Avoid importing types that caused issues earlier; this object works with NextAuth v4.
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

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            // ✅ use the DateTime field, not the old boolean
            emailVerifiedAt: true,
          },
        });

        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(pw, user.password);
        if (!ok) return null;

        // ✅ block login until verified timestamp exists
        if (!user.emailVerifiedAt) {
          // This becomes ?error=EMAIL_NOT_VERIFIED on /login
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

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        (session.user as any).id = token?.id;
        (session.user as any).role = token?.role ?? "USER";
      }
      return session;
    },
  },
} as const;

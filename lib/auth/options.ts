// lib/auth/options.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcryptjs from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toString().trim().toLowerCase() ?? "";
        const password = credentials?.password?.toString() ?? "";

        if (!email || !password) {
          throw new Error("Missing email or password");
        }

        // Only select fields that exist in your Prisma schema
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true, // boolean
            password: true,      // bcryptjs hash stored here
          },
        });

        if (!user) throw new Error("Invalid email or password");
        if (!user.emailVerified) throw new Error("Email not verified");

        if (!user.password) throw new Error("No password set for this account");

        const ok = await bcryptjs.compare(password, user.password);
        if (!ok) throw new Error("Invalid email or password");

        return { id: String(user.id), email: user.email, name: user.name ?? "" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) (session.user as any).id = token.id as string;
      return session;
    },
  },
};

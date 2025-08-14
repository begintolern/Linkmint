// lib/auth/options.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) throw new Error("Missing email or password");

        // Fetch full user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) throw new Error("Invalid email or password");

        // Check if email is verified (boolean or Date)
        const isVerified =
          typeof (user as any).emailVerified === "boolean"
            ? ((user as any).emailVerified as boolean)
            : Boolean((user as any).emailVerified);

        if (!isVerified) throw new Error("Email not verified");

        // Determine password hash field
        const storedHash =
          ((user as any).password as string | undefined) ??
          ((user as any).passwordHash as string | undefined) ??
          null;

        if (!storedHash) throw new Error("No password set for this account");

        // Compare password
        const ok = await bcrypt.compare(password, storedHash);
        if (!ok) throw new Error("Invalid email or password");

        // Return session user object
        return {
          id: (user as any).id,
          email: (user as any).email,
          name: (user as any).name ?? undefined,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = (user as any).email;
        token.name = (user as any).name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) return null;

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !user.password) return null;

  const isValid = await bcrypt.compare(credentials.password, user.password);
  if (!isValid) return null;

  // Only return fields accepted by NextAuth
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
  };
},

    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any; // Disable strict typing temporarily
        token.id = u.id;
        token.trustScore = u.trustScore;
        token.badges = u.referralBadge;
        token.badgeInviter = u.badgeInviter;
        token.badgeActiveReferrer = u.badgeActiveReferrer;
        token.badgePowerReferrer = u.badgePowerReferrer;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.trustScore = token.trustScore;
        session.user.badges = token.badges;
        session.user.badgeInviter = token.badgeInviter;
        session.user.badgeActiveReferrer = token.badgeActiveReferrer;
        session.user.badgePowerReferrer = token.badgePowerReferrer;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

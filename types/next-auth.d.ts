// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;

      // ✅ Custom fields
      trustScore?: number;
      badges?: string[];
      badgeInviter?: boolean;
      badgeActiveReferrer?: boolean;
      badgePowerReferrer?: boolean;
    };
  }

  interface User {
    id: string;
    trustScore?: number;
    badges?: string[];
    badgeInviter?: boolean;
    badgeActiveReferrer?: boolean;
    badgePowerReferrer?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    trustScore?: number;
    badges?: string[];
    badgeInviter?: boolean;
    badgeActiveReferrer?: boolean;
    badgePowerReferrer?: boolean;
  }
}

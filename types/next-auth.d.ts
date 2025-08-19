// types/next-auth.d.ts
import type { DefaultSession } from "next-auth/next";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      // Your custom fields
      trustScore?: number;
      badges?: string[];
      badgeInviter?: boolean;
      badgeActiveReferrer?: boolean;
      badgePowerReferrer?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "USER";
    // Your custom fields
    trustScore?: number;
    badges?: string[];
    badgeInviter?: boolean;
    badgeActiveReferrer?: boolean;
    badgePowerReferrer?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string; // NextAuth uses `sub` for user id
    role?: "ADMIN" | "USER";
    // Your custom fields
    trustScore?: number;
    badges?: string[];
    badgeInviter?: boolean;
    badgeActiveReferrer?: boolean;
    badgePowerReferrer?: boolean;
  }
}

// Make this file a module
export {};

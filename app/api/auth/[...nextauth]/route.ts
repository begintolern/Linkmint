// app/api/auth/[...nextauth]/route.ts
// Version-agnostic handler that compiles on both NextAuth v4 (App Router) and v5,
// and avoids “no call signatures” type issues on some builders.

import NextAuthEntry from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

// Force callable to dodge type shadowing from local module augmentation.
const NextAuthAny = NextAuthEntry as unknown as (cfg: unknown) => any;

// v5 returns { handlers }, v4 returns a handler function.
const out = NextAuthAny(authOptions as any);

export const GET = out?.handlers?.GET ?? out;
export const POST = out?.handlers?.POST ?? out;

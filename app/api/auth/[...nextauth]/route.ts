// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs"; // Prisma-safe
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

// TS in some setups thinks NextAuth from "next-auth" isn't callable.
// The "next-auth/next" entry works correctly in the App Router.
const handler = (NextAuth as unknown as (opts: unknown) => any)(authOptions as any);

export { handler as GET, handler as POST };

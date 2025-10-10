// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const handler = (NextAuth as unknown as (opts: unknown) => any)(authOptions as any);

export { handler as GET, handler as POST };

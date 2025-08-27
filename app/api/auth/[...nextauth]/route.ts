// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";           // <-- ensure Node runtime (Prisma works)
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import NextAuthEntry from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const NextAuthAny = NextAuthEntry as unknown as (cfg: unknown) => any;
const out = NextAuthAny(authOptions as any);

export const GET = out?.handlers?.GET ?? out;
export const POST = out?.handlers?.POST ?? out;

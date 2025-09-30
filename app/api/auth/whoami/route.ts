// app/api/auth/whoami/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const session = (await getServerSession(authOptions)) as any;
  return NextResponse.json({
    signedIn: !!session?.user,
    user: session?.user || null,
  });
}

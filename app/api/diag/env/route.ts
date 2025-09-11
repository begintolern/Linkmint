import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const adminKey = (process.env.ADMIN_KEY ?? "").trim();
  const nextAuth = (process.env.NEXTAUTH_SECRET ?? "").trim();
  return NextResponse.json({
    hasAdminKey: !!adminKey,
    adminKeyLen: adminKey.length,
    hasNextAuth: !!nextAuth,
    nextAuthLen: nextAuth.length,
  });
}

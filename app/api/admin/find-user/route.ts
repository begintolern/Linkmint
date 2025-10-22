import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isAdmin(req: Request) {
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();
  const cookie = req.headers.get("cookie") || "";
  const header = (req.headers.get("x-admin-key") || "").trim();
  const hasCookie = adminKey && cookie.includes(`admin_key=${adminKey}`);
  return adminKey ? (hasCookie || header === adminKey) : true;
}

export async function POST(req: Request) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => null) as { email?: string } | null;
    const email = body?.email?.trim();
    if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, referredById: true, name: true },
    });

    if (!user) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

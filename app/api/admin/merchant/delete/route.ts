export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// Reuse the same admin detection logic you used elsewhere.
async function isAdmin(): Promise<boolean> {
  const store = cookies();
  const cookieRole = (store.get("role")?.value ?? "").toLowerCase();
  if (cookieRole === "admin") return true;

  const email = store.get("email")?.value || "";
  const uid =
    store.get("uid")?.value ||
    store.get("userId")?.value ||
    "";

  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (email && allowList.includes(email.toLowerCase())) return true;

  try {
    if (uid) {
      const u = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
      if (u?.role && String(u.role).toLowerCase() === "admin") return true;
    }
    if (email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { role: true } });
      if (u?.role && String(u.role).toLowerCase() === "admin") return true;
    }
  } catch { /* ignore */ }

  return false;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json().catch(() => ({}));
  if (!id || typeof id !== "string") {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    const deleted = await prisma.merchantRule.delete({ where: { id } });
    return NextResponse.json({
      ok: true,
      deleted: {
        id: deleted.id,
        merchantName: deleted.merchantName,
        market: (deleted as any).market,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

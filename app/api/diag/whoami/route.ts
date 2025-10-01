// app/api/diag/whoami/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

function splitList(s?: string | null) {
  return (s || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  const store = cookies();

  const cookieRole = (store.get("role")?.value || "").toLowerCase();
  const email = store.get("email")?.value || "";
  const uid =
    store.get("uid")?.value ||
    store.get("userId")?.value ||
    "";

  const adminEmails = splitList(process.env.ADMIN_EMAILS);
  const envAdmin = !!(email && adminEmails.includes(email.toLowerCase()));

  let dbRole: string | null = null;
  try {
    if (uid) {
      const u = await prisma.user.findUnique({ where: { id: uid }, select: { role: true, email: true } });
      dbRole = (u?.role ? String(u.role) : null)?.toLowerCase() || null;
    } else if (email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { role: true, email: true } });
      dbRole = (u?.role ? String(u.role) : null)?.toLowerCase() || null;
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "DB lookup failed", detail: String(e?.message || e) }, { status: 500 });
  }

  const isAdmin = cookieRole === "admin" || dbRole === "admin" || envAdmin;

  return NextResponse.json({
    ok: true,
    cookie: { role: cookieRole, email, uid },
    env: { ADMIN_EMAILS: process.env.ADMIN_EMAILS || null },
    derived: { dbRole, envAdmin, isAdmin },
  });
}

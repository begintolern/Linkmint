// app/api/admin/merchant-rules/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const ADMIN_EMAILS = new Set<string>([
  "epo78741@yahoo.com",
  "admin@linkmint.co",
  "ertorig3@gmail.com",
]);

async function allow(req: NextRequest) {
  // 1) Server session (DB sessions)
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const email = session?.user?.email;
    const role = String(session?.user?.role ?? "").toUpperCase();
    if (email) {
      const emailLc = String(email).toLowerCase();
      if (role === "ADMIN" || ADMIN_EMAILS.has(emailLc)) return true;
    }
  } catch {}

  // 2) JWT token (jwt strategy)
  try {
    const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as any;
    const email = token?.email;
    const role = String(token?.role ?? "").toUpperCase();
    if (email) {
      const emailLc = String(email).toLowerCase();
      if (role === "ADMIN" || ADMIN_EMAILS.has(emailLc)) return true;
    }
  } catch {}

  return false;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await allow(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    await prisma.merchantRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "DELETE failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

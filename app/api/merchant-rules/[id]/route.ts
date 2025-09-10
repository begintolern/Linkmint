// app/api/admin/merchant-rules/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAILS = new Set<string>([
  "epo78741@yahoo.com",
  "admin@linkmint.co",
  "ertorig3@gmail.com",
]);

async function allow(req: NextRequest) {
  // 1) Header key
  const configured = (process.env.ADMIN_KEY ?? "").trim();
  const headerKey = (req.headers.get("x-admin-key") ?? "").trim();
  if (configured && headerKey === configured) return true;

  // 2) NextAuth token (role/email)
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.email) {
      const emailLc = String(token.email).toLowerCase();
      const role = String((token as any).role ?? "").toUpperCase();
      if (role === "ADMIN" || ADMIN_EMAILS.has(emailLc)) return true;
    }
  } catch {
    // ignore
  }

  // 3) Dev fallback
  if (process.env.NODE_ENV !== "production") return true;

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

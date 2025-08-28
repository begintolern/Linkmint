export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json().catch(() => ({} as any));
    if (!token || !password) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const prt = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!prt) return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
    if (prt.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ ok: false, error: "expired_token" }, { status: 400 });
    }

    const hash = await bcrypt.hash(String(password), 10);

    await prisma.user.update({
      where: { id: prt.userId },
      data: { password: hash },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

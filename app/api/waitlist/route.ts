// app/api/waitlist/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (typeof email !== "string" || !isValidEmail(email.trim())) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    await prisma.waitlist.upsert({
      where: { email: normalized },
      update: { source: source ?? "cap-closed" },
      create: { email: normalized, source: source ?? "cap-closed" },
    });

    return NextResponse.json({ ok: true, message: "added_to_waitlist" }, { status: 201 });
  } catch (err) {
    console.error("[waitlist] ERROR", err);
    return NextResponse.json({ ok: false, error: "waitlist_failed" }, { status: 500 });
  }
}

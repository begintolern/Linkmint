// app/api/waitlist/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("[WAITLIST] raw body:", body);

    const emailRaw = String(body?.email ?? "").trim().toLowerCase();
    const source = (body?.source ?? "cap-closed") as string;

    if (!emailRaw) {
      console.log("[WAITLIST] missing email");
      return NextResponse.json(
        { ok: false, error: "missing_email" },
        { status: 400 }
      );
    }

    if (!isValidEmail(emailRaw)) {
      console.log("[WAITLIST] invalid_email:", emailRaw);
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 }
      );
    }

    const result = await prisma.waitlist.upsert({
  where: { email: emailRaw },
  update: { source },
  create: {
    id: crypto.randomUUID(),
    email: emailRaw,
    source,
    // status is handled by the DB default for now
  } as any,
});


    console.log("[WAITLIST] upsert OK:", result.id);

    return NextResponse.json(
      { ok: true, message: "added_to_waitlist" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[WAITLIST] POST error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "unknown_error",
        debug: String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("ping")) {
    return NextResponse.json({ ok: true, pong: true });
  }
  return NextResponse.json({ ok: true });
}

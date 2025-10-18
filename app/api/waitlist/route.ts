// app/api/waitlist/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// very lightweight email check (keeps false positives low)
function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = String(body?.email ?? "").trim().toLowerCase();
    const source = (body?.source ?? "cap-closed") as string;

    if (!emailRaw || !isValidEmail(emailRaw)) {
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Upsert requires `create` to satisfy all required fields on your model.
    // We provide an explicit id and safe timestamps for schemas without defaults.
    await prisma.waitlist.upsert({
      where: { email: emailRaw },
      update: { source },
      create: {
        id: crypto.randomUUID(), // ✅ fix: provide id explicitly
        email: emailRaw,
        source,
        createdAt: now,          // safe if your model lacks @default(now())
        updatedAt: now,          // safe if your model lacks @updatedAt
      } as any,                  // cast to avoid TS friction across schema variants
    });

    return NextResponse.json(
      { ok: true, message: "added_to_waitlist" },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  // optional health check: /api/waitlist?ping=1
  const { searchParams } = new URL(req.url);
  if (searchParams.get("ping")) {
    return NextResponse.json({ ok: true, pong: true });
  }
  return NextResponse.json({ ok: true });
}

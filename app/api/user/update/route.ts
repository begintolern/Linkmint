// app/api/user/update/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

type Body = {
  name?: string | null;
  paypalEmail?: string | null;
};

const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (body.paypalEmail && !isEmail(body.paypalEmail)) {
      return NextResponse.json(
        { ok: false, error: "Invalid PayPal email." },
        { status: 400 }
      );
    }

    // STUB: no DB writes yet — just acknowledge.
    // You can later persist to Prisma (User or PayoutAccount).
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }
}

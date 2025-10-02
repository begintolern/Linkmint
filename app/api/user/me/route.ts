// app/api/user/me/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Minimal, non-DB stub: read a couple of cookies so UI has something useful
    // (Adjust later to load from Prisma)
    const user = {
      id: "me",
      email: "you@example.com",
      name: "",
      paypalEmail: "",
      market: null as "PH" | "US" | null,
    };

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Failed to load user." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const r = await fetch("http://localhost:3001/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testwaitlist@example.com",
        source: "manual-test"
      }),
    });

    const status = r.status;
    const text = await r.text();

    return NextResponse.json({ ok: true, status, text });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message });
  }
}

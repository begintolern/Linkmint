// app/api/debug/email/route.ts
import { NextResponse } from "next/server";
import sendVerificationEmail from "@/lib/email/sendVerificationEmail";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const to = process.env.FOUNDER_EMAIL || process.env.EMAIL_FROM || "admin@linkmint.co";

  try {
    console.log("[debug-email] triggering test email to", to);
    await sendVerificationEmail(to, "debug-test-token");
    return NextResponse.json({ ok: true, to }, { status: 200 });
  } catch (err: any) {
    console.error("[debug-email] failed:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}

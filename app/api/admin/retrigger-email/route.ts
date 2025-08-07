// Temporary route file: app/api/admin/retrigger-email/route.ts
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const email = "epo78741@gmail.com";
    const token = "d71f1071-2101-451c-b73d-2d7fa1fdcf54";

    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true, message: "Verification email resent." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

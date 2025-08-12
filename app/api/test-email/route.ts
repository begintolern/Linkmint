import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing SENDGRID_API_KEY" }, { status: 500 });
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const msg = {
      to: "ertorig3@gmail.com",               // test recipient
      from: { email: "admin@linkmint.co", name: "Linkmint" }, // must be your verified/domain-auth sender
      subject: "Linkmint Test Email",
      text: "This is a plain‑text test from Linkmint.",
      html: "<p>This is a <strong>test</strong> from Linkmint.</p>",
      // replyTo: "temp@nope.com",             // optional—use a real inbox if you add this
    };

    const res = await sgMail.send(msg);
    return NextResponse.json({ ok: true, sgMessageId: res?.[0]?.headers["x-message-id"] ?? null });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err), stack: err?.stack },
      { status: 500 }
    );
  }
}

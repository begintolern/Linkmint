import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const to = url.searchParams.get("to") || "ertorig3@gmail.com";

    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing SENDGRID_API_KEY" },
        { status: 500 }
      );
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: { email: "admin@linkmint.co", name: "Linkmint" }, // must be verified/domain-auth sender
      replyTo: "admin@linkmint.co",
      subject: "Linkmint Test Email",
      text: "This is a plain text test from Linkmint.",
      html: `<p>This is a <strong>test</strong> from Linkmint.</p>`,
    };

    const res = await sgMail.send(msg);
    return NextResponse.json({
      ok: true,
      to,
      sgMessageId: res?.[0]?.headers?.["x-message-id"] ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

// app/api/contact/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    // TODO: send to email, Slack, or persist in DB
    console.log("[contact] ", { name, email, message });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/contact error", e);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

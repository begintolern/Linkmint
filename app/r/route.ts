// app/r/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force base domain for consistency
const BASE_DOMAIN = "https://linkmint.co";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const to = url.searchParams.get("to");
  const sid = url.searchParams.get("sid") || null;

  if (!to) {
    return NextResponse.json({ ok: false, error: "Missing to" }, { status: 400 });
  }

  // Ensure the destination is always logged with the correct base domain
  const normalizedLink = `${BASE_DOMAIN}/r?to=${encodeURIComponent(to)}${
    sid ? `&sid=${encodeURIComponent(sid)}` : ""
  }`;

  // Log the click
  try {
    await prisma.eventLog.create({
      data: {
        type: "LINK_CLICK",
        detail: normalizedLink,
        message: `sid=${sid ?? ""} ip=${req.ip ?? ""} ua=${req.headers.get(
          "user-agent"
        ) ?? ""} ref=${req.headers.get("referer") ?? ""} -> ${to}`,
      },
    });
  } catch (e) {
    console.error("Error logging click:", e);
  }

  // Redirect user to the actual Amazon/CJ product
  return NextResponse.redirect(to);
}

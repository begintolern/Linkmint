// app/api/smartlink/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const urlParam = new URL(req.url).searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  // Example: append affiliate tag — replace with your actual affiliate logic
  const affiliateUrl = `${urlParam}?tag=linkmint-20`;

  return NextResponse.redirect(affiliateUrl);
}

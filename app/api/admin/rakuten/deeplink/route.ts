import { NextResponse } from "next/server";
import { createDeepLink } from "@/lib/partners/rakutenClient";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const data = await createDeepLink(url);
  return NextResponse.json(data);
}
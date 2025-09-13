import { NextResponse } from "next/server";
import { listAdvertisers } from "@/lib/partners/rakutenClient";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 50);

  const data = await listAdvertisers({ q, page, pageSize });
  return NextResponse.json(data);
}

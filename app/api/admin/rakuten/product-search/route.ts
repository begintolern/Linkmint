import { NextResponse } from "next/server";
import { productSearch } from "@/lib/partners/rakutenClient";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const keyword = url.searchParams.get("keyword") || undefined;
  const advertiserId = url.searchParams.get("advertiserId") || undefined;
  const page = Number(url.searchParams.get("page") || 1);

  const data = await productSearch({
    keyword,
    advertiserId: advertiserId ?? undefined,
    page,
  });
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { listPartnerships } from "@/lib/partners/rakutenClient";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined; // APPROVED|PENDING|DECLINED
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 50);

  const data = await listPartnerships({ status, page, pageSize });
  return NextResponse.json(data);
}

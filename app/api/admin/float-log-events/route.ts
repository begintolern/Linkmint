// app/api/admin/float-logs/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { fetchFloatLogs } from "@/lib/apiHandlers/floatLogsHandler";

export async function GET() {
  const result = await fetchFloatLogs();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ floatLogs: result.floatLogs });
}

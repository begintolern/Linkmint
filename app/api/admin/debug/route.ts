// app/api/admin/debug/route.ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    note: "debug root is reachable",
    children: ["delete-user"],
  });
}

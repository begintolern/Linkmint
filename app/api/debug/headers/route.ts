import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const headers = Object.fromEntries(req.headers.entries());

  return NextResponse.json({
    seenHeaders: headers,
  });
}

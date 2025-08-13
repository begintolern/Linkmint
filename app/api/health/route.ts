import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Try a quick DB check, but don't crash if it fails
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check DB error:", error);
    return NextResponse.json({
      status: "ok",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
}

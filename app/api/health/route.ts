import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful");
    return NextResponse.json({
      status: "ok",
      database: "connected",
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    return NextResponse.json({
      status: "error",
      database: "unavailable",
      error: String(err),
    });
  }
}

// app/api/dev/logs/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // simple header check
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // IMPORTANT: detail must be JSON, not string | null
  const result = await prisma.eventLogs.createMany({
    data: [
      {
        type: "seed",
        message: "Inserted from seed endpoint",
        // store explicit JSON null
        detail: Prisma.JsonNull,
        userId: null,
      },
      {
        type: "seed",
        message: "Inserted with JSON object",
        // store a JSON object
        detail: { seeded: true, at: new Date().toISOString() } as Prisma.InputJsonValue,
        userId: null,
      },
    ],
  });

  return NextResponse.json({ ok: true, inserted: result.count });
}

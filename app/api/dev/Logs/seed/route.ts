// app/api/dev/Logs/seed/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const result = await prisma.eventLog.createMany({
      data: [
        {
          type: "seed",
          message: "Seeding started",
          detail: JSON.stringify({ step: 1, info: "Begin seeding dev logs" }),
          userId: "system", // NOTE: must be a valid User.id if FK is enforced
        },
        {
          type: "seed",
          message: "Inserted initial data",
          detail: JSON.stringify({ step: 2, items: 3 }),
          userId: "system",
        },
        {
          type: "seed",
          message: "Seeding complete",
          detail: JSON.stringify({ step: 3, status: "ok" }),
          userId: "system",
        },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, inserted: result.count });
  } catch (err) {
    console.error("Dev Logs seed error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

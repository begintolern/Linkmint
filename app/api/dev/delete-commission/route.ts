// TEMPORARY – delete after use
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // delete commission with amount = 1.23
    const result = await prisma.commission.deleteMany({
      where: { amount: 1.23 }
    });

    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}

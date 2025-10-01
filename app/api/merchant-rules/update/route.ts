// app/api/admin/merchant-rules/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { id, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing merchant id" }, { status: 400 });
    }

    const updated = await prisma.merchantRule.update({
      where: { id },
      data: { notes },
    });

    return NextResponse.json({ ok: true, merchant: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProdAdmin } from "@/lib/utils/adminGuard";

export async function POST(req: Request) {
  try {
    const gate = await assertProdAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { userEmail, amount = 4.55, source = "TEST_AMAZON" } = await req.json();

    const user = await prisma.user.findUnique({ where: { email: (userEmail || "").toLowerCase() } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const payout = await prisma.payout.create({
      data: {
        userId: user.id,
        amount: Number(amount),
        status: "Pending",
        source,
      } as any,
    });

    return NextResponse.json({ success: true, payoutId: payout.id });
  } catch (err) {
    console.error("simulate-purchase error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

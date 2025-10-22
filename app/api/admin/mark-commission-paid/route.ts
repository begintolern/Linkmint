import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isAdmin(req: Request) {
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();
  const cookie = req.headers.get("cookie") || "";
  const header = (req.headers.get("x-admin-key") || "").trim();
  const hasCookie = adminKey && cookie.includes(`admin_key=${adminKey}`);
  return adminKey ? (hasCookie || header === adminKey) : true; // allow in dev if no key
}

export async function POST(req: Request) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as { id?: string } | null;
    const id = body?.id?.trim();
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

    // 1) Load commission
    const commission = await prisma.commission.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        paidOut: true,
      },
    });

    if (!commission) {
      return NextResponse.json({ ok: false, error: "Commission not found" }, { status: 404 });
    }

    // 2) Flip to PAID + paidOut=true
    const updated = await prisma.commission.update({
      where: { id: commission.id },
      data: {
        status: "PAID",
        paidOut: true,
        finalizedAt: new Date(),
      },
    });

    // 3) (Optional) Create a minimal Payout record — best-effort, non-blocking
    // If this fails, we still return ok:true because the Commission is already PAID.
    try {
      await prisma.payout.create({
        data: {
          userId: commission.userId,
          amount: Number(commission.amount),
          method: "MANUAL",
          status: "PAID",
          statusEnum: "PAID",
          provider: "MANUAL",
          approvedAt: new Date(),
          paidAt: new Date(),
          netCents: Math.round(Number(commission.amount) * 100),
          feeCents: 0,
        },
      });
    } catch {
      // ignore payout creation failures
    }

    return NextResponse.json({
      ok: true,
      message: "Commission marked as PAID.",
      commission: updated,
    });
  } catch (e: any) {
    console.error("[admin/mark-commission-paid] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

// app/api/admin/commissions/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuardFromReq } from "@/lib/utils/adminGuardReq";

type Body = { action?: "approve" | "pay" | "reject" };

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  // Admin auth via JWT (works reliably in route handlers)
  const gate = await adminGuardFromReq(req);
  if (!gate.ok) {
    return gate.res; // use guard’s own NextResponse
  }

  const id = ctx.params.id;
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    // noop – allow missing body, default to approve below if desired
  }
  const action = (body.action || "approve") as Body["action"];

  // Load commission
  const commission = await prisma.commission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      paidOut: true,
      type: true,
      source: true,
      description: true,
      createdAt: true,
    },
  });

  if (!commission) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // Simple state machine
  if (action === "approve") {
    if (commission.status === "Paid") {
      return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
    }
    if (commission.status === "Approved") {
      return NextResponse.json({ success: true, commission });
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "Approved" },
    });

    await prisma.eventLog.create({
      data: {
        userId: commission.userId,
        type: "commission",
        message: `Commission ${id} approved`,
        detail: JSON.stringify({
          amount: commission.amount,
          prevStatus: commission.status,
          newStatus: "Approved",
        }),
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  }

  if (action === "pay") {
    if (commission.status !== "Approved") {
      return NextResponse.json(
        { success: false, error: "Must be Approved before paying" },
        { status: 400 }
      );
    }
    if (commission.paidOut) {
      return NextResponse.json({ success: true, commission });
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "Paid", paidOut: true },
    });

    await prisma.eventLog.create({
      data: {
        userId: commission.userId,
        type: "commission",
        message: `Commission ${id} marked paid (manual)`,
        detail: JSON.stringify({
          amount: commission.amount,
          prevStatus: commission.status,
          newStatus: "Paid",
        }),
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  }

  if (action === "reject") {
    if (commission.status === "Paid") {
      return NextResponse.json(
        { success: false, error: "Cannot reject a Paid commission" },
        { status: 400 }
      );
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "Rejected" },
    });

    await prisma.eventLog.create({
      data: {
        userId: commission.userId,
        type: "commission",
        message: `Commission ${id} rejected`,
        detail: JSON.stringify({
          amount: commission.amount,
          prevStatus: commission.status,
          newStatus: "Rejected",
        }),
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { PrismaClient, PayoutStatus } from "@prisma/client";

const prisma = new PrismaClient();

// TEMP admin check: header x-admin: true
function isAdmin(req: Request) {
  return req.headers.get("x-admin") === "true";
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { processorNote } = body ?? {};

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        processedAt: new Date(),
        processorNote: processorNote ?? null,
      },
      select: {
        id: true,
        status: true,
        processedAt: true,
        processorNote: true,
      },
    });

    return NextResponse.json({ ok: true, payoutRequest: updated });
  } catch (err: any) {
    // If not found, return 404 cleanly
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Mark paid error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

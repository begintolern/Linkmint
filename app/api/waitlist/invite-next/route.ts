// app/api/waitlist/invite-next/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Same cap as /api/system/cap
const MAX_ACTIVE_USERS = 70;

export async function GET() {
  try {
    // 1) Check current user count against cap
    const activeCount = await prisma.user.count();
    if (activeCount >= MAX_ACTIVE_USERS) {
      return NextResponse.json(
        {
          ok: false,
          reason: "cap_full",
          message:
            "User cap reached. Disable/remove a user before inviting from waitlist.",
          activeCount,
          max: MAX_ACTIVE_USERS,
        },
        { status: 400 }
      );
    }

    // 2) Pick the oldest 'waiting' waitlist entry.
    // We use raw SQL because Prisma's types don't know about the `status` column,
    // but the DB table does.
    const rows = (await prisma.$queryRawUnsafe(`
      SELECT "id", "email"
      FROM "Waitlist"
      WHERE COALESCE("status", 'waiting') = 'waiting'
      ORDER BY "createdAt" ASC
      LIMIT 1
    `)) as { id: string; email: string }[];

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          reason: "no_waiting",
          message: "No waiting entries found in the waitlist.",
        },
        { status: 404 }
      );
    }

    const entry = rows[0];

    // 3) Mark this waitlist entry as invited
    await prisma.$executeRawUnsafe(`
      UPDATE "Waitlist"
      SET "status" = 'invited'
      WHERE "id" = '${entry.id}'
    `);

    // 4) Return info you can use to send an invite manually
    return NextResponse.json({
      ok: true,
      invitedId: entry.id,
      email: entry.email,
      message:
        "Next waitlist user marked as invited. Use this email in your invite message.",
    });
  } catch (err: any) {
    console.error("[WAITLIST INVITE-NEXT] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "unknown_error",
      },
      { status: 500 }
    );
  }
}

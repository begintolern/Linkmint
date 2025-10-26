// app/api/admin/warnings/demo/route.ts
export const runtime = "nodejs"; // ✅ Ensure Prisma runs in Node.js runtime

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { safeAuditLog } from "@/lib/auditLog";

const prisma = new PrismaClient();

/**
 * Auth helper: checks x-admin-key header or cookie against ADMIN_API_KEY.
 */
function isAdmin(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY || "";
  if (!adminKey) return false;
  const cookieKey = req.cookies.get("admin_key")?.value;
  const headerKey = req.headers.get("x-admin-key");
  return cookieKey === adminKey || headerKey === adminKey;
}

/**
 * POST /api/admin/warnings/demo
 * Body: { "userId": "USER_ID", "type"?: "RATE_LIMIT_LINK_CREATION", "message"?: "..." }
 * Creates a demo USER_WARNING log entry for testing pipelines/end-to-end alerts.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = (body?.userId ?? "").toString().trim();
    const type = (body?.type ?? "RATE_LIMIT_LINK_CREATION").toString();
    const message =
      (body?.message as string) ??
      `Demo warning created for user ${userId || "(no userId provided)"}.`;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    // Write a USER_WARNING entry into your system/audit log (or SQL fallback)
    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message,
      json: {
        userId,
        warning: {
          type,
          createdAt: new Date().toISOString(),
          evidence: { demo: true },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        demo: true,
        userId,
        type,
        message,
      },
      { status: 200 }
    );
  } catch (err: any) {
    await safeAuditLog(prisma, {
      type: "ERROR",
      message: "Admin demo warning failed",
      json: { error: String(err?.message || err) },
    });
    return NextResponse.json({ ok: false, error: "DEMO_FAILED" }, { status: 500 });
  }
}

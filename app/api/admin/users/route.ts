// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Minimal cookie-based admin gate used for ops bootstrap.
// We already use this pattern for disable/enable/trust successfully.
function isCookieAdmin(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  return /(?:^|;\s*)role=admin(?:;|$)/i.test(cookie);
}

type Body =
  | { action: "disable"; userId?: string; email?: string }
  | { action: "enable"; userId?: string; email?: string }
  | { action: "setTrustScore"; userId?: string; email?: string; trustScore: number }
  | { action: "unfreeze"; userId?: string; email?: string }
  | { action: "setRole"; userId?: string; email?: string; role: "admin" | "user" };

function uniqueWhere(input: { userId?: string; email?: string }) {
  if (input.userId) return { id: input.userId };
  if (input.email) return { email: input.email };
  throw new Error("Provide userId or email");
}

export async function POST(req: NextRequest) {
  try {
    if (!isCookieAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;

    // Disable
    if (body.action === "disable") {
      const where = uniqueWhere(body);
      const user = await prisma.user.update({
        where,
        data: { disabled: true },
      });
      return NextResponse.json({ ok: true, user });
    }

    // Enable
    if (body.action === "enable") {
      const where = uniqueWhere(body);
      const user = await prisma.user.update({
        where,
        data: { disabled: false },
      });
      return NextResponse.json({ ok: true, user });
    }

    // Set TrustScore
    if (body.action === "setTrustScore") {
      const where = uniqueWhere(body);
      const trustScore = Math.max(0, Math.min(100, Number(body.trustScore ?? 0)));
      const user = await prisma.user.update({
        where,
        // @ts-ignore (trustScore exists in your schema)
        data: { trustScore },
      });
      return NextResponse.json({ ok: true, user });
    }

    // Unfreeze: enable + (optionally) reset trustScore if you want
    if (body.action === "unfreeze") {
      const where = uniqueWhere(body);
      const user = await prisma.user.update({
        where,
        // @ts-ignore
        data: { disabled: false },
      });
      return NextResponse.json({ ok: true, user });
    }

    // NEW: Set Role (admin/user)
    if (body.action === "setRole") {
      const where = uniqueWhere(body);
      const role = body.role === "admin" ? "admin" : "user";
      const user = await prisma.user.update({
        where,
        // @ts-ignore (role enum/string exists in your schema)
        data: { role },
      });
      return NextResponse.json({
        ok: true,
        message: `User role set to ${role}`,
        user,
        via: "cookie:role=admin",
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("admin/users error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Convenience list to verify things without opening the UI
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: offset,
      take: limit,
      select: { id: true, email: true, name: true, disabled: true, /* @ts-ignore */ trustScore: true, /* @ts-ignore */ role: true },
      orderBy: { createdAt: "desc" as any },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({ ok: true, total, page, limit, users });
}

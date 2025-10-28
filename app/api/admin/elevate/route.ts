// app/api/admin/elevate/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "clwzud5zr0000v4l5gnkz1oz3";
const ADMIN_GRANT_TOKEN = process.env.ADMIN_GRANT_TOKEN || "";

// Session type guard
type AdminSession =
  | {
      user?: { id?: string; role?: string; email?: string | null } | null;
    }
  | null;

async function requireAdminOrToken(req: Request): Promise<{ ok: boolean; actor: string; via: "session" | "token" }> {
  // 1) Try NextAuth admin session
  try {
    const session = (await getServerSession(authOptions as any)) as AdminSession;
    const uid = session?.user?.id;
    const role = session?.user?.role;
    const email = session?.user?.email ?? "admin";
    if (uid && (uid === ADMIN_USER_ID || role === "admin")) {
      return { ok: true, actor: String(email), via: "session" };
    }
  } catch {}

  // 2) Optional bootstrap token (?token=...)
  if (ADMIN_GRANT_TOKEN) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (token && token === ADMIN_GRANT_TOKEN) {
      return { ok: true, actor: "bootstrap-token", via: "token" };
    }
  }

  return { ok: false, actor: "unknown", via: "session" };
}

/**
 * GET: peek a user (by id or email)
 *   /api/admin/elevate?userId=... | &email=...
 */
export async function GET(req: Request) {
  const gate = await requireAdminOrToken(req);
  if (!gate.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;
  const email = searchParams.get("email") || undefined;
  if (!userId && !email) return NextResponse.json({ ok: false, error: "Provide userId or email" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: userId }, { email }] },
    select: { id: true, email: true, name: true, disabled: true, trustScore: true },
  });

  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true, user });
}

/**
 * POST: elevate/demote admin
 * Body:
 * {
 *   "userId"?: string,
 *   "email"?: string,
 *   "makeAdmin": boolean           // true => admin, false => regular
 * }
 *
 * Tries `role='admin'|'user'`; if not present, tries `isAdmin=true|false`.
 * If neither field exists, returns a schema hint.
 */
export async function POST(req: Request) {
  const gate = await requireAdminOrToken(req);
  if (!gate.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { userId, email, makeAdmin } = body as {
    userId?: string;
    email?: string;
    makeAdmin?: boolean;
  };

  if (!userId && !email) return NextResponse.json({ ok: false, error: "Provide userId or email" }, { status: 400 });
  if (typeof makeAdmin !== "boolean") return NextResponse.json({ ok: false, error: "makeAdmin must be boolean" }, { status: 400 });

  // Narrow lookup result to avoid type collisions
  const userRow = await prisma.user.findFirst({
    where: { OR: [{ id: userId ?? undefined }, { email: email ?? undefined }] },
    select: { id: true, email: true, name: true },
  });
  if (!userRow || !userRow.id) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  const userIdStr = String(userRow.id);

  // Attempt A: use `role` enum
  try {
    const updated = await prisma.user.update({
      where: { id: userIdStr },
      data: { role: makeAdmin ? "admin" : "user" } as any,
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      ok: true,
      message: makeAdmin ? "User elevated to admin" : "User demoted to regular",
      user: updated,
      actor: gate.actor,
      via: gate.via,
    });
  } catch (e) {
    // fall through to Attempt B
  }

  // Attempt B: use `isAdmin` boolean
  try {
    const updated = await prisma.user.update({
      where: { id: userIdStr },
      data: { isAdmin: !!makeAdmin } as any,
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      ok: true,
      message: makeAdmin ? "User elevated to admin" : "User demoted to regular",
      user: updated,
      actor: gate.actor,
      via: gate.via,
    });
  } catch (e2) {
    const hint = [
      "Your User model appears to have neither `role` nor `isAdmin`.",
      "Add one of the following to prisma/schema.prisma and migrate:",
      "",
      "Option 1 (enum role):",
      "  enum Role {",
      "    user",
      "    admin",
      "  }",
      "  model User {",
      "    id        String @id @default(cuid())",
      "    email     String @unique",
      "    name      String?",
      "    // ...",
      "    role      Role   @default(user)",
      "  }",
      "",
      "Option 2 (boolean flag):",
      "  model User {",
      "    id        String @id @default(cuid())",
      "    email     String @unique",
      "    name      String?",
      "    // ...",
      "    isAdmin   Boolean @default(false)",
      "  }",
      "",
      "Then run:",
      "  npx prisma generate",
      "  npx prisma migrate dev --name add-user-admin-role",
    ].join("\n");
    return NextResponse.json(
      { ok: false, error: "Schema missing admin field", hint, details: String(e2) },
      { status: 400 }
    );
  }
}

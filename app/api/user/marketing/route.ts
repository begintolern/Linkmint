// app/api/user/marketing/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * We avoid importing authOptions by reading the session via /api/auth/session,
 * forwarding the caller's cookies. Works with NextAuth App Router.
 */
async function getSessionSubject(req: NextRequest): Promise<{ ok: boolean; subject?: string }> {
  try {
    const url = new URL("/api/auth/session", req.nextUrl);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!res.ok) return { ok: false };

    const data = await res.json().catch(() => ({} as any));
    // Prefer user.id if present; else user.email
    const subject =
      (data?.user?.id && String(data.user.id)) ||
      (data?.user?.email && String(data.user.email));

    if (!subject) return { ok: false };
    return { ok: true, subject };
  } catch {
    return { ok: false };
  }
}

// Namespaced per-user keys in systemSetting (no migration needed)
function k(uidOrEmail: string, name: "promoSmsOptIn" | "promoSmsNumber") {
  return `user:${uidOrEmail}:${name}`;
}

// GET -> { ok, optIn, number }
export async function GET(req: NextRequest) {
  const session = await getSessionSubject(req);
  if (!session.ok || !session.subject) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: [k(session.subject, "promoSmsOptIn"), k(session.subject, "promoSmsNumber")] } },
    select: { key: true, value: true },
  });

  const map = new Map(rows.map((r) => [r.key, r.value ?? ""]));
  const optIn = (map.get(k(session.subject, "promoSmsOptIn")) ?? "false").toLowerCase() === "true";
  const number = map.get(k(session.subject, "promoSmsNumber")) ?? "";

  return NextResponse.json({ ok: true, optIn, number });
}

// PATCH body: { optIn?: boolean, number?: string }
export async function PATCH(req: NextRequest) {
  const session = await getSessionSubject(req);
  if (!session.ok || !session.subject) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const nextOptIn = typeof body?.optIn === "boolean" ? body.optIn : undefined;
  const nextNumRaw = typeof body?.number === "string" ? body.number : undefined;
  // Basic sanitize: digits and + only, max 32 chars
  const nextNum = nextNumRaw ? nextNumRaw.replace(/[^\d+]/g, "").slice(0, 32) : undefined;

  const ops: Promise<any>[] = [];
  if (nextOptIn !== undefined) {
    ops.push(
      prisma.systemSetting.upsert({
        where: { key: k(session.subject, "promoSmsOptIn") },
        create: { key: k(session.subject, "promoSmsOptIn"), value: String(nextOptIn) },
        update: { value: String(nextOptIn) },
      })
    );
  }
  if (nextNum !== undefined) {
    ops.push(
      prisma.systemSetting.upsert({
        where: { key: k(session.subject, "promoSmsNumber") },
        create: { key: k(session.subject, "promoSmsNumber"), value: nextNum },
        update: { value: nextNum },
      })
    );
  }
  await Promise.all(ops);

  await prisma.eventLog.create({
    data: {
      type: "marketing",
      message: "Promo SMS prefs updated",
      detail: JSON.stringify({
        subject: session.subject,
        optIn: nextOptIn,
        numberChanged: nextNum !== undefined,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    saved: { optIn: nextOptIn, number: nextNum },
  });
}

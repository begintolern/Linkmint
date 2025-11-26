import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserBrief = {
  id: string;
  email: string | null;
  name: string | null;
  referredById: string | null;
};

type CommissionRow = {
  id: string;
  userId: string;
  amount: number | string;
  status: string;
  paidOut: boolean;
  type: string;
  source: string | null;
  description: string | null;
  createdAt: Date;
  user: UserBrief | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // pagination
    const limit = clampInt(parseInt(searchParams.get("limit") || "50", 10), 1, 200);
    const cursor = searchParams.get("cursor") || undefined;

    // filters
    const status = pick(searchParams.get("status"));
    const type = pick(searchParams.get("type"));
    const paid = pick(searchParams.get("paid"));
    const email = pick(searchParams.get("email"));
    const q = pick(searchParams.get("q"));
    const dateFrom = pick(searchParams.get("dateFrom"));
    const dateTo = pick(searchParams.get("dateTo"));

    const where: any = {};

    // status: allow single or comma-separated (e.g. "PENDING,APPROVED")
    if (status) {
      const parts = status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length === 1) {
        where.status = parts[0];
      } else if (parts.length > 1) {
        where.status = { in: parts };
      }
    }

    if (type) where.type = type;
    if (paid === "paid") where.paidOut = true;
    if (paid === "unpaid") where.paidOut = false;

    if (email) {
      where.user = { is: { email: { contains: email, mode: "insensitive" } } };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // fetch page (+1 to probe next page)
    const page = await prisma.commission.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: String(cursor) } }),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true, referredById: true } },
      },
    });

    // optional free-text post-filter
    const filtered: CommissionRow[] = q
      ? page.filter((it: any) => {
          const haystack = [
            it.user?.email ?? "",
            it.user?.name ?? "",
            it.source ?? "",
            it.description ?? "",
            String(it.id),
            it.type,
            it.status,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q.toLowerCase());
        })
      : (page as any);

    const hasNext = filtered.length > limit;
    const data = hasNext ? filtered.slice(0, -1) : filtered;
    const nextCursor = hasNext ? String(filtered[filtered.length - 1].id) : null;

    const mapped = data.map((it: any) => {
      const amountNum = Number(it.amount);
      const hasReferrer = !!it.user?.referredById;

      const userShare = round2(amountNum * 0.7);
      const referrerShare = hasReferrer ? round2(amountNum * 0.05) : 0;
      const platformShare = round2(amountNum - userShare - referrerShare);

      const userBrief: UserBrief | null = it.user
        ? {
            id: String(it.user.id),
            email: it.user.email ?? null,
            name: it.user.name ?? null,
            referredById: it.user.referredById ?? null,
          }
        : null;

      return {
        id: String(it.id),
        userId: String(it.userId),
        amount: amountNum,
        status: String(it.status),
        paidOut: Boolean(it.paidOut),
        type: String(it.type),
        source: it.source ?? null,
        description: it.description ?? null,
        createdAt: it.createdAt as Date,
        user: userBrief,
        userShare,
        referrerShare,
        platformShare,
        hasReferrer,
      };
    });

    return NextResponse.json({
      success: true,
      items: mapped,
      rows: mapped,
      nextCursor,
    });
  } catch (e: any) {
    console.error("Error in /api/admin/commissions", e);
    return NextResponse.json(
      { success: false, error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}

function pick(v: string | null): string | undefined {
  if (!v) return undefined;
  const t = v.trim();
  return t ? t : undefined;
}
function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// app/api/admin/commissions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserBrief = {
  id: string;
  email: string | null;
  name: string | null;
};

type CommissionRow = {
  id: string;
  userId: string;
  amount: number | string; // Prisma.Decimal | number | string
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

    // filters (all optional)
    const status = pick(searchParams.get("status")); // e.g. APPROVED
    const type = pick(searchParams.get("type")); // e.g. referral_purchase
    const paid = pick(searchParams.get("paid")); // "paid" | "unpaid"
    const email = pick(searchParams.get("email")); // contains
    const q = pick(searchParams.get("q")); // free text (applied post-fetch)
    const dateFrom = pick(searchParams.get("dateFrom"));
    const dateTo = pick(searchParams.get("dateTo"));

    // Prisma where
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (paid === "paid") where.paidOut = true;
    if (paid === "unpaid") where.paidOut = false;

    if (email) {
      // relation filter (works on modern Prisma)
      where.user = { is: { email: { contains: email, mode: "insensitive" } } };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // fetch page (+1 to probe next page)
    const page: CommissionRow[] = await prisma.commission.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    // optional free-text post-filter on the fetched slice
    const filtered: CommissionRow[] = q
      ? page.filter((it: CommissionRow) => {
          const haystack = [
            it.user?.email ?? "",
            it.user?.name ?? "",
            it.source ?? "",
            it.description ?? "",
            it.id,
            it.type,
            it.status,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q.toLowerCase());
        })
      : page;

    const hasNext = filtered.length > limit;
    const data: CommissionRow[] = hasNext ? filtered.slice(0, -1) : filtered;
    const nextCursor = hasNext ? filtered[filtered.length - 1].id : null;

    // add share breakdowns (adjust if you have custom rules)
    const mapped = data.map((it: CommissionRow) => {
      const amountNum = Number(it.amount);
      const userShare = round2(amountNum * 0.7);
      const referrerShare = round2(amountNum * 0.05);
      const platformShare = round2(amountNum - userShare - referrerShare);
      return {
        id: it.id,
        userId: it.userId,
        amount: amountNum,
        status: it.status,
        paidOut: it.paidOut,
        type: it.type,
        source: it.source,
        description: it.description,
        createdAt: it.createdAt,
        user: {
          id: it.user?.id ?? null,
          email: it.user?.email ?? null,
          name: it.user?.name ?? null,
        },
        userShare,
        referrerShare,
        platformShare,
        hasReferrer: Boolean(it.userId), // tweak if you track referrer separately
      };
    });

    // return both shapes for compatibility with existing code
    return NextResponse.json({
      success: true,
      items: mapped,
      rows: mapped,
      nextCursor,
    });
  } catch (e: any) {
    console.error("Error in /api/admin/commissions", e);
    return NextResponse.json(
      { success: false, error: e.message ?? "Server error" },
      { status: 500 }
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

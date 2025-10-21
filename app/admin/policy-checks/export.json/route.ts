// app/admin/policy-checks/export.json/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  // auth: allow role=admin OR admin_key cookie
  const jar = cookies();
  const role = (jar.get("role")?.value || "").toLowerCase();
  const hasAdminKey = !!jar.get("admin_key")?.value;
  if (!(role === "admin" || hasAdminKey)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const severity = url.searchParams.get("severity") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const from = url.searchParams.get("from") || undefined; // YYYY-MM-DD
  const to = url.searchParams.get("to") || undefined;

  const where: any = {};
  if (severity && ["NONE", "LOW", "MEDIUM", "HIGH"].includes(severity)) {
    where.severity = severity;
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from + "T00:00:00.000Z");
    if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
  }
  if (q) {
    where.OR = [
      { sampleText: { contains: q, mode: "insensitive" } },
      { engine: { contains: q, mode: "insensitive" } },
      { categories: { has: q } },
    ];
  }

  const rows = await prisma.policyCheckLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  return NextResponse.json({ ok: true, rows });
}

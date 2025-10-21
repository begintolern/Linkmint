// app/admin/policy-checks/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

function toCsvCell(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  const needsQuotes = /[",\n]/.test(s);
  const esc = s.replace(/"/g, '""');
  return needsQuotes ? `"${esc}"` : esc;
}

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
    take: 2000, // cap export
    select: {
      id: true,
      createdAt: true,
      userId: true,
      ip: true,
      userAgent: true,
      inputChars: true,
      engine: true,
      severity: true,
      categories: true,
      sampleText: true,
      findings: true,
      rawResult: true,
    },
  });

  const header = [
    "id","createdAt","severity","engine","inputChars","categories",
    "userId","ip","userAgent","sampleText","findings","rawResult"
  ];

  const lines = [
    header.join(","),
    ...rows.map(r => [
      toCsvCell(r.id),
      toCsvCell(r.createdAt.toISOString()),
      toCsvCell(r.severity),
      toCsvCell(r.engine),
      toCsvCell(r.inputChars),
      toCsvCell((r.categories ?? []).join("|")),
      toCsvCell(r.userId ?? ""),
      toCsvCell(r.ip ?? ""),
      toCsvCell(r.userAgent ?? ""),
      toCsvCell(r.sampleText ?? ""),
      toCsvCell(r.findings ?? null),
      toCsvCell(r.rawResult ?? null),
    ].join(",")),
  ];

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="policy_check_logs.csv"`,
    },
  });
}

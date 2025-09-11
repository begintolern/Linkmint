// app/api/admin/merchant-rules/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAILS = new Set<string>([
  "epo78741@yahoo.com",
  "admin@linkmint.co",
  "ertorig3@gmail.com",
]);

async function allow(req: NextRequest) {
  // 1) Header key
  const configured = (process.env.ADMIN_KEY ?? "").trim();
  const headerKey = (req.headers.get("x-admin-key") ?? "").trim();
  if (configured && headerKey === configured) return true;

  // 2) NextAuth token (role/email)
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.email) {
      const emailLc = String(token.email).toLowerCase();
      const role = String((token as any).role ?? "").toUpperCase();
      if (role === "ADMIN" || ADMIN_EMAILS.has(emailLc)) return true;
    }
  } catch {
    // ignore
  }

  // 3) Dev fallback
  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

// GET: list all rules
export async function GET(req: NextRequest) {
  if (!(await allow(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rules = await prisma.merchantRule.findMany({
      orderBy: { merchantName: "asc" },
    });
    return NextResponse.json({ success: true, rules });
  } catch (err: any) {
    return NextResponse.json(
      { error: "GET failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// POST: create a rule
export async function POST(req: NextRequest) {
  if (!(await allow(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await req.json();
    const created = await prisma.merchantRule.create({
      data: {
        active: data.active ?? true,
        merchantName: data.merchantName,
        network: data.network ?? null,
        domainPattern: data.domainPattern ?? null,
        paramKey: data.paramKey ?? null,
        paramValue: data.paramValue ?? null,
        linkTemplate: data.linkTemplate ?? null,
        allowedSources: data.allowedSources ?? [],
        disallowed: data.disallowed ?? [],
        cookieWindowDays: data.cookieWindowDays ?? null,
        payoutDelayDays: data.payoutDelayDays ?? null,
        commissionType: data.commissionType ?? "PERCENT",
        commissionRate: data.commissionRate ?? null,
        calc: data.calc ?? null,
        rate: data.rate ?? null,
        notes: data.notes ?? null,
        importMethod: data.importMethod ?? "MANUAL",
        apiBaseUrl: data.apiBaseUrl ?? null,
        apiAuthType: data.apiAuthType ?? null,
        apiKeyRef: data.apiKeyRef ?? null,
        lastImportedAt: data.lastImportedAt ?? null,
      },
    });
    return NextResponse.json({ success: true, created });
  } catch (err: any) {
    return NextResponse.json(
      { error: "POST failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// DELETE: remove a rule by id
export async function DELETE(req: NextRequest) {
  if (!(await allow(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await prisma.merchantRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "DELETE failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

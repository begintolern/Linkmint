// app/api/admin/merchant-rules/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const ADMIN_EMAILS = new Set<string>([
  "epo78741@yahoo.com",
  "admin@linkmint.co",
  "ertorig3@gmail.com",
]);

async function allow(req: NextRequest) {
  // 1) NextAuth server session (DB sessions; App Router form)
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const email = session?.user?.email;
    const role = String(session?.user?.role ?? "").toUpperCase();
    if (email) {
      const emailLc = String(email).toLowerCase();
      if (role === "ADMIN" || ADMIN_EMAILS.has(emailLc)) return true;
    }
  } catch {
    // fall through
  }

  // 2) JWT token (when using "jwt" strategy)
  try {
    const token = (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })) as any;
    const email = token?.email;
    const role = String(token?.role ?? "").toUpperCase();
    if (email) {
      const emailLc = String(email).toLowerCase();
      if (role === "ADMIN" || ADMIN_EMAILS.has(emailLc)) return true;
    }
  } catch {
    // fall through
  }

  // Block if none matched
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

// DELETE here is not used (we use /api/admin/merchant-rules/[id]), keep for safety.
export async function DELETE(req: NextRequest) {
  if (!(await allow(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

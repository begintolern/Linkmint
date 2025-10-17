// app/api/admin/network-accounts/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AffiliateNetwork } from "@prisma/client"; // ✅ import the enum directly

function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();

    // Inputs
    const networkRaw = String(body.network ?? "").trim();
    const accountId = String(body.accountId ?? "").trim();
    const note = body.note ? String(body.note) : null;

    if (!networkRaw || !accountId) {
      return NextResponse.json(
        { ok: false, error: "network and accountId are required" },
        { status: 400 }
      );
    }

    // ✅ Validate against the enum exported by @prisma/client
    const allowedNetworks = Object.values(AffiliateNetwork) as string[];
    if (!allowedNetworks.includes(networkRaw)) {
      return NextResponse.json(
        { ok: false, error: `Invalid network. Allowed: ${allowedNetworks.join(", ")}` },
        { status: 400 }
      );
    }
    const network = networkRaw as AffiliateNetwork;

    const now = new Date();

    const created = await prisma.networkAccount.create({
      data: {
        id: crypto.randomUUID(),
        network,                 // ✅ enum, not string
        accountId,
        note,
        createdAt: now,
        updatedAt: now,
      },
      select: {
        id: true,
        network: true,
        accountId: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, account: created });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const rows = await prisma.networkAccount.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, network: true, accountId: true, note: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, accounts: rows });
}

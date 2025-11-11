// app/api/merchants/rules/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/merchants/rules?key=lazada-ph
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = (url.searchParams.get("key") || "").trim();

    if (key) {
      // single rule
      const rows = await prisma.$queryRawUnsafe<
        { merchant_key: string; display_name: string; rules_json: any; updated_at: string }[]
      >(
        `SELECT merchant_key, display_name, rules_json, updated_at
         FROM merchant_rules
         WHERE merchant_key = $1
         LIMIT 1;`,
        key
      );
      if (!rows.length) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ ok: true, rule: rows[0] }, { status: 200 });
    }

    // list all
    const rows = await prisma.$queryRawUnsafe<
      { merchant_key: string; display_name: string; updated_at: string }[]
    >(
      `SELECT merchant_key, display_name, updated_at
       FROM merchant_rules
       ORDER BY display_name ASC;`
    );

    return NextResponse.json({ ok: true, rules: rows }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/merchants/rules error:", err?.message || err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

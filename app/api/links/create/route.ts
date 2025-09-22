// app/api/links/create/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  validateShopeeDistribution,
  normalizeShopeeUrl,
  getShopeeComplianceCard,
} from "@/lib/compliance/shopee";

/**
 * POST /api/links/create
 * Body:
 * {
 *   merchantId: string,
 *   destinationUrl: string,
 *   source: "TikTok" | "Instagram" | "Facebook" | "YouTube" | "Blog/Website" | "Email (opt-in)" | "Search Ads" | "Other",
 *   plannedKeywords?: string[]        // only if source === "Search Ads"
 * }
 *
 * Behavior:
 * - Loads merchant from DB.
 * - If Shopee PH (inferred by domainPattern/name), runs compliance checks and normalizer.
 * - Returns {ok:false, errors} if blocked; otherwise returns normalized URL, warnings, acks to show in UI.
 * - DOES NOT persist anything yet (non-destructive). Wire your UI to call this before saving.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const merchantId = String(body?.merchantId || "").trim();
    const destinationUrl = String(body?.destinationUrl || "").trim();
    const source = String(body?.source || "");
    const plannedKeywords: string[] = Array.isArray(body?.plannedKeywords)
      ? body.plannedKeywords
      : [];

    if (!merchantId || !destinationUrl || !source) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Missing input. Required: merchantId, destinationUrl, source.",
        },
        { status: 400 }
      );
    }

    // Load the merchant (omit 'market' to avoid Prisma type drift)
    const merchant = await prisma.merchantRule.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        merchantName: true,
        domainPattern: true,
        allowedSources: true as any,
        disallowed: true as any,
        cookieWindowDays: true as any,
        payoutDelayDays: true as any,
        notes: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { ok: false, message: "Merchant not found." },
        { status: 404 }
      );
    }

    // Infer “Shopee PH” without reading 'market' (compile-safe):
    const name = (merchant.merchantName || "").toLowerCase();
    const host = (merchant.domainPattern || "").toLowerCase();
    const looksShopeePH =
      name.includes("shopee") || host.includes("shopee.ph");

    // Default pass-through results
    let normalizedUrl = destinationUrl;
    const warnings: string[] = [];
    const requiredAcknowledgements: string[] = [];

    if (looksShopeePH) {
      // 1) Distribution validation (blocks disallowed practices)
      const v = validateShopeeDistribution({ source: source as any, plannedKeywords });
      if (!v.ok) {
        return NextResponse.json(
          { ok: false, errors: v.errors, warnings: v.warnings, requiredAcknowledgements: v.requiredAcknowledgements },
          { status: 400 }
        );
      }
      warnings.push(...v.warnings);
      requiredAcknowledgements.push(...v.requiredAcknowledgements);

      // 2) URL normalization (ensure clean shopee.ph link format)
      const n = normalizeShopeeUrl(destinationUrl);
      if (!n.ok) {
        return NextResponse.json(
          { ok: false, errors: [n.reason || "Invalid Shopee URL."] },
          { status: 400 }
        );
      }
      normalizedUrl = n.url;

      // 3) Provide a compliance card payload for UI
      const card = getShopeeComplianceCard({
        id: merchant.id,
        merchantName: merchant.merchantName,
        market: "PH", // inferred for UI purposes
        domainPattern: merchant.domainPattern,
        allowedSources: merchant.allowedSources as any,
        disallowed: merchant.disallowed as any,
        cookieWindowDays: merchant.cookieWindowDays as any,
        payoutDelayDays: merchant.payoutDelayDays as any,
        notes: merchant.notes,
      });

      return NextResponse.json({
        ok: true,
        merchant: {
          id: merchant.id,
          name: merchant.merchantName,
          market: "PH",
        },
        normalizedUrl,
        policy: card,
        warnings,
        requiredAcknowledgements,
      });
    }

    // Non-Shopee merchants: return pass-through for now (no-op)
    return NextResponse.json({
      ok: true,
      merchant: {
        id: merchant.id,
        name: merchant.merchantName,
        market: null,
      },
      normalizedUrl,
      warnings,
      requiredAcknowledgements,
      policy: null,
    });
  } catch (err) {
    console.error("links/create POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to prepare link." },
      { status: 500 }
    );
  }
}

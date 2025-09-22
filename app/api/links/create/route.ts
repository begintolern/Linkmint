// app/api/links/create/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isShopeePH,
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
 * - If Shopee PH: runs compliance checks and normalizer.
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

    // Load the merchant minimally
    const merchant = await prisma.merchantRule.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        merchantName: true,
        market: true as any, // tolerate older Prisma clients
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

    // Default pass-through results
    let normalizedUrl = destinationUrl;
    const warnings: string[] = [];
    const requiredAcknowledgements: string[] = [];
    const errors: string[] = [];

    // Shopee PH compliance
    if (isShopeePH(merchant as any)) {
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
      const card = getShopeeComplianceCard(merchant as any);

      return NextResponse.json({
        ok: true,
        merchant: {
          id: merchant.id,
          name: merchant.merchantName,
          market: (merchant as any).market ?? null,
        },
        normalizedUrl,
        policy: card,
        warnings,
        requiredAcknowledgements,
        // NOTE: Do NOT persist yet. Let the UI confirm acks, then call your real save endpoint.
      });
    }

    // Non-Shopee merchants: return pass-through for now (no-op)
    return NextResponse.json({
      ok: true,
      merchant: {
        id: merchant.id,
        name: merchant.merchantName,
        market: (merchant as any).market ?? null,
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

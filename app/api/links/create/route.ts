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
 *   plannedKeywords?: string[],        // only if source === "Search Ads"
 *   acksAccepted?: string[]            // user-checked acknowledgements (2nd call)
 * }
 *
 * Behavior:
 * - Loads merchant from DB.
 * - If Shopee PH (inferred by domainPattern/name), runs compliance checks and normalizer.
 * - First call (no acks): returns requiredAcknowledgements + warnings + normalizedUrl + policy card.
 * - Second call (with acksAccepted that cover all requiredAcknowledgements): returns ok:true (ready to persist).
 * - DOES NOT persist yet; this endpoint is a validator/gate.
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
    const acksAccepted: string[] = Array.isArray(body?.acksAccepted)
      ? body.acksAccepted
      : [];

    if (!merchantId || !destinationUrl || !source) {
      return NextResponse.json(
        { ok: false, message: "Missing input. Required: merchantId, destinationUrl, source." },
        { status: 400 }
      );
    }

    // Load the merchant (omit 'market' to avoid Prisma type drift in CI)
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

    // Infer “Shopee PH” without reading 'market' (compile-safe)
    const name = (merchant.merchantName || "").toLowerCase();
    const host = (merchant.domainPattern || "").toLowerCase();
    const looksShopeePH = name.includes("shopee") || host.includes("shopee.ph");

    // Default pass-through
    let normalizedUrl = destinationUrl;
    const warnings: string[] = [];
    const requiredAcknowledgements: string[] = [];

    if (looksShopeePH) {
      // 1) Distribution validation
      const v = validateShopeeDistribution({ source: source as any, plannedKeywords });
      if (!v.ok) {
        return NextResponse.json(
          { ok: false, errors: v.errors, warnings: v.warnings, requiredAcknowledgements: v.requiredAcknowledgements },
          { status: 400 }
        );
      }
      warnings.push(...v.warnings);
      requiredAcknowledgements.push(...v.requiredAcknowledgements);

      // 2) URL normalization
      const n = normalizeShopeeUrl(destinationUrl);
      if (!n.ok) {
        return NextResponse.json(
          { ok: false, errors: [n.reason || "Invalid Shopee URL."] },
          { status: 400 }
        );
      }
      normalizedUrl = n.url;

      // 3) Compliance card for UI
      const card = getShopeeComplianceCard({
        id: merchant.id,
        merchantName: merchant.merchantName,
        market: "PH",
        domainPattern: merchant.domainPattern,
        allowedSources: merchant.allowedSources as any,
        disallowed: merchant.disallowed as any,
        cookieWindowDays: merchant.cookieWindowDays as any,
        payoutDelayDays: merchant.payoutDelayDays as any,
        notes: merchant.notes,
      });

      // 4) If client sent acknowledgements, enforce them here
      if (acksAccepted.length > 0) {
        const missing = requiredAcknowledgements.filter(
          (req) => !acksAccepted.includes(req)
        );
        if (missing.length > 0) {
          return NextResponse.json(
            {
              ok: false,
              message: "Missing required acknowledgements.",
              missing,
              requiredAcknowledgements,
              warnings,
              normalizedUrl,
              policy: card,
            },
            { status: 400 }
          );
        }
        // All good → signal ready to persist (your real save endpoint should follow)
        return NextResponse.json({
          ok: true,
          ready: true,
          merchant: { id: merchant.id, name: merchant.merchantName, market: "PH" },
          normalizedUrl,
          policy: card,
          warnings,
        });
      }

      // First pass (no acks yet) → return the requirements
      return NextResponse.json({
        ok: true,
        ready: false,
        merchant: { id: merchant.id, name: merchant.merchantName, market: "PH" },
        normalizedUrl,
        policy: card,
        warnings,
        requiredAcknowledgements,
      });
    }

    // Non-Shopee merchants: no special gating (for now)
    return NextResponse.json({
      ok: true,
      ready: true,
      merchant: { id: merchant.id, name: merchant.merchantName, market: null },
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

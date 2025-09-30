// app/api/ai/policy-check/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

// ---- Simple heuristic patterns (fast, no-LLM fallback) ----
const HEURISTICS: Array<{ cat: string; rx: RegExp; hint: string }> = [
  { cat: "GiftCards", rx: /\bgift\s*card(s)?\b|e[-\s]?gift/i, hint: "Many merchants exclude gift cards." },
  { cat: "CouponStacking", rx: /\bstack(ing)?\b|\bdouble[-\s]?dip\b/i, hint: "Coupon stacking often disallowed." },
  { cat: "SelfPurchase", rx: /\b(self[-\s]?purchase|self[-\s]?referr(al|ing)|buy\s*through\s*your\s*own\s*link)\b/i, hint: "Self-purchase/self-referral usually prohibited." },
  { cat: "CashEquivalent", rx: /\bcash\s*equivalent|prepaid|reload\b/i, hint: "Cash equivalents usually excluded." },
  { cat: "PaidSearch", rx: /\bbrand\s*bidding|trademark\s*bidding|SEM|PPC\b/i, hint: "Paid search brand/trademark bidding often restricted." },
  { cat: "ProhibitedGoods", rx: /\btobacco|vape|weapon|ammo|adult\b/i, hint: "Some verticals are banned across networks." },
  { cat: "CouponTerms", rx: /\bcoupon\s*code|promo\s*code|exclusions?\b/i, hint: "Check coupon code/exclusions language." },
  { cat: "CashbackClaims", rx: /\bcash\s*back|cashback\b/i, hint: "Cashback wording may be restricted by some programs." },
];

function heuristicScan(text: string) {
  const findings: string[] = [];
  const cats = new Set<string>();
  for (const h of HEURISTICS) {
    if (h.rx.test(text)) {
      cats.add(h.cat);
      findings.push(`${h.cat}: ${h.hint}`);
    }
  }
  const severity = cats.size >= 3 ? "HIGH" : cats.size === 2 ? "MEDIUM" : cats.size === 1 ? "LOW" : "NONE";
  const ok = cats.size === 0;
  return { ok, severity, categories: [...cats], findings };
}

// ---- LLM call (optional, behind flag + API key) ----
async function llmCheck(text: string) {
  if (process.env.AI_POLICY_CHECK_ENABLED !== "1" || !process.env.OPENAI_API_KEY) {
    return null; // disabled or no key → no LLM
  }

  const system = `You are a compliance assistant for affiliate marketing content.
Return STRICT JSON ONLY, with no extraneous text:
{"ok": boolean, "severity": "LOW"|"MEDIUM"|"HIGH"|"NONE", "categories": string[], "findings": string[], "suggestions": string[]}

Rules to flag (non-exhaustive):
- Gift cards / cash equivalents / reloads often excluded.
- Coupon stacking / double-dipping often disallowed.
- Self-purchase / self-referral prohibited in many programs.
- Paid search brand/trademark bidding frequently restricted.
- Restricted categories: tobacco, vape, weapons, adult.
- Avoid promising guaranteed earnings.
Keep it concise. If nothing risky, set ok=true and severity="NONE".`;

  const user = `Analyze this affiliate text for likely policy/merchant-rule risks:

${text.slice(0, 6000)}
`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    const j = await r.json();
    const content =
      j?.choices?.[0]?.message?.content ??
      '{"ok":true,"severity":"NONE","categories":[],"findings":[],"suggestions":[]}';

    // Be defensive: parse or default
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { ok: true, severity: "NONE", categories: [], findings: [], suggestions: [] };
    }
    return {
      ok: !!parsed.ok,
      severity: String(parsed.severity || "NONE"),
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      raw: undefined, // don’t echo model output
    };
  } catch {
    return null; // fail-quiet; heuristics still apply
  }
}

function combine(heur: any, llm: any) {
  if (!llm) return { ...heur, suggestions: [] };

  function rank(sev: unknown): number {
    const s = typeof sev === "string" ? sev.toUpperCase() : "NONE";
    switch (s) {
      case "HIGH": return 3;
      case "MEDIUM": return 2;
      case "LOW": return 1;
      default: return 0; // NONE / unknown
    }
  }

  const severity = rank(heur.severity) >= rank(llm.severity) ? heur.severity : llm.severity;
  const ok = Boolean(heur.ok) && Boolean(llm.ok);
  const categories = Array.from(new Set([...(heur.categories || []), ...(llm.categories || [])]));
  const findings = Array.from(new Set([...(heur.findings || []), ...(llm.findings || [])]));
  const suggestions = Array.from(new Set((llm.suggestions || []).filter(Boolean)));

  return { ok, severity, categories, findings, suggestions };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const text = String(body?.text || `${title}\n\n${description}`).slice(0, 12000);

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "NO_TEXT", message: "Provide title/description/text for analysis." },
        { status: 400 }
      );
    }

    // 1) Heuristic baseline
    const heur = heuristicScan(text);

    // 2) Optional LLM pass
    const llm = await llmCheck(text);

    // 3) Combine
    const result = combine(heur, llm);

    return NextResponse.json({
      ok: true,
      assessment: result,
      inputEcho: { title, description, textLen: text.length },
      usedLLM: !!llm,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "POLICY_CHECK_ERROR", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

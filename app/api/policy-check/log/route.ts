// app/api/policy-check/log/route.ts
import { NextResponse } from "next/server";
import { logPolicyCheck } from "@/lib/log/policyCheck";
import type { PolicySeverity } from "@prisma/client";

// helper: extract IP even behind proxies
function getClientIP(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

export async function POST(req: Request) {
  try {
    // 🔒 Safely parse body (handles bad JSON without crashing)
    let json: any = null;
    try {
      json = await req.json();
    } catch {
      const text = await req.text().catch(() => "");
      try {
        json = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON payload" },
          { status: 400 }
        );
      }
    }

    const {
      inputChars,
      engine,
      severity,
      categories,
      findings,
      rawResult,
      sampleText,
    } = json ?? {};


    // basic validation
    if (
      typeof inputChars !== "number" ||
      !engine ||
      !severity ||
      !Array.isArray(categories)
    ) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    // map severity to enum safely
    const validSev = new Set<PolicySeverity>(["NONE", "LOW", "MEDIUM", "HIGH"] as const);
    const sev = String(severity).toUpperCase() as PolicySeverity;
    const severityEnum: PolicySeverity = validSev.has(sev) ? sev : "NONE";

    const ip = getClientIP(req);
    const userAgent = req.headers.get("user-agent");

    const saved = await logPolicyCheck({
      userId: null, // no NextAuth dependency—avoid crashes
      ip,
      userAgent,
      inputChars,
      engine,
      severity: severityEnum,
      categories,
      findings,
      rawResult,
      sampleText: typeof sampleText === "string" ? sampleText : null,
    });

    return NextResponse.json({ ok: true, id: saved.id, at: saved.createdAt });
  } catch (err) {
    console.error("[policy-check/log] error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

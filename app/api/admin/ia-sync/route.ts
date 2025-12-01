// app/api/admin/ia-sync/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

/**
 * Admin guard using ADMIN_EMAILS (comma-separated) from env.
 * Example:
 *   ADMIN_EMAILS="admin@linkmint.co,epo78741@yahoo.com,ertorig3@gmail.com"
 */
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(email.toLowerCase());
}

async function ensureAdmin(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session || !(session.user as any)?.email) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      ),
      email: null as string | null,
    };
  }

  const email = (session.user as any).email as string;

  if (!isAdminEmail(email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      ),
      email,
    };
  }

  return { ok: true, response: null, email };
}

/**
 * Helper to read and validate IA env vars.
 * Step 3: env-check
 */
function readIaEnv() {
  const apiKey = process.env.IA_API_KEY || "";
  const publisherId = process.env.IA_PUBLISHER_ID || "";
  const subsiteId = process.env.IA_SUBSITE_ID || "";
  const base = process.env.IA_API_BASE || "https://api.involve.asia/publisher";

  const missing: string[] = [];
  if (!apiKey) missing.push("IA_API_KEY");
  if (!publisherId) missing.push("IA_PUBLISHER_ID");
  // subsite is optional for now; we don't require it at this stage

  return {
    apiKey,
    publisherId,
    subsiteId,
    base,
    missing,
  };
}

export async function POST(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok || !auth.email) {
    return auth.response!;
  }

  // ----- STEP 3: ENV CHECK -----
  const ia = readIaEnv();
  if (ia.missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        step: 3,
        phase: "env-check",
        message:
          "One or more required IA env vars are missing. IA sync is disabled until these are set.",
        missing: ia.missing,
      },
      { status: 200 }
    );
  }

  // ----- STEP 4: SANDBOX FETCH FROM IA (READ-ONLY) -----
  const baseUrl = ia.base.replace(/\/$/, "");
  const url = `${baseUrl}/v3/transactions`;

  // For now: simple "pending/last page" style query.
  // You can tweak params later once we see real payload shape.
  const query = new URLSearchParams({
    publisher_id: ia.publisherId,
    page: "1",
    per_page: "50",
    // status: "pending", // uncomment if IA supports status filter
  });

  let httpStatus = 0;
  let rawText = "";
  let parsed: any = null;

  try {
    const resp = await fetch(`${url}?${query.toString()}`, {
      method: "GET",
      headers: {
        // Header style may need adjusting based on IA docs.
        // This is a first wiring; if you get 401/403, we'll tweak.
        "Content-Type": "application/json",
        apikey: ia.apiKey,
      },
      // Make sure we don't cache this
      cache: "no-store",
    });

    httpStatus = resp.status;
    rawText = await resp.text();

    if (!resp.ok) {
      // Log the failure for debugging
      try {
        await prisma.eventLog.create({
          data: {
            userId: null,
            type: "ia_sync_error",
            message: `IA transaction fetch failed (HTTP ${resp.status})`,
            detail: rawText.slice(0, 8000),
          },
        });
      } catch (logErr: any) {
        console.error("[ia-sync] failed to log error:", logErr?.message || logErr);
      }

      return NextResponse.json(
        {
          ok: false,
          step: 4,
          phase: "fetch",
          httpStatus: resp.status,
          message:
            "IA API call failed. Check EventLog (type=ia_sync_error) for raw response.",
        },
        { status: 200 }
      );
    }

    // Try to parse JSON
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    const snapshot = rawText.slice(0, 8000);

    // Log raw payload in sandbox mode ONLY (no commissions yet)
    try {
      await prisma.eventLog.create({
        data: {
          userId: null,
          type: "ia_sync_raw",
          message: "IA sandbox transaction fetch succeeded (Step 4)",
          detail: snapshot,
        },
      });
    } catch (logErr: any) {
      console.error("[ia-sync] failed to log raw payload:", logErr?.message || logErr);
    }

    const dataArray = Array.isArray(parsed?.data)
      ? parsed.data
      : Array.isArray(parsed)
      ? parsed
      : null;

    return NextResponse.json(
      {
        ok: true,
        step: 4,
        phase: "fetch",
        httpStatus: httpStatus,
        count: dataArray ? dataArray.length : null,
        message:
          "IA API call succeeded in sandbox mode. Raw payload logged as ia_sync_raw. No commissions updated yet.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    const msg = err?.message || "Unknown error in IA fetch";

    try {
      await prisma.eventLog.create({
        data: {
          userId: null,
          type: "ia_sync_error",
          message: "IA transaction fetch threw an exception",
          detail: msg,
        },
      });
    } catch (logErr: any) {
      console.error("[ia-sync] failed to log exception:", logErr?.message || logErr);
    }

    return NextResponse.json(
      {
        ok: false,
        step: 4,
        phase: "fetch-exception",
        message: msg,
      },
      { status: 200 }
    );
  }
}

// Optional: allow a simple GET to test in browser
export async function GET(request: NextRequest) {
  return POST(request);
}

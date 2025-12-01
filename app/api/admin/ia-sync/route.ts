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
 * ADMIN_EMAILS="admin@linkmint.co, epo78741@yahoo.com"
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
      ok: false as const,
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
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      ),
      email,
    };
  }

  return { ok: true as const, response: null as NextResponse | null, email };
}

/**
 * Step 3: Environment validation for IA sync
 *
 * We DON'T call Involve Asia yet.
 * - Read IA_* envs
 * - If anything critical is missing, log an EventLog row + return explanation
 * - If everything needed is present, log success and say we're ready for real API wiring
 */

type IaConfig =
  | {
      ok: true;
      config: {
        apiKey: string;
        publisherId: string;
        subSiteId: string | null;
        baseUrl: string;
      };
    }
  | {
      ok: false;
      missing: string[];
      reason: string;
    };

function readIaConfig(): IaConfig {
  const apiKey = (process.env.IA_API_KEY || "").trim();
  const publisherId = (process.env.IA_PUBLISHER_ID || "").trim();
  const subSiteId = (process.env.IA_SUBSITE_ID || "").trim();
  const baseUrl =
    (process.env.IA_API_BASE || "https://api.involve.asia/publisher").trim();

  const missing: string[] = [];
  if (!apiKey) missing.push("IA_API_KEY");
  if (!publisherId) missing.push("IA_PUBLISHER_ID");
  if (!baseUrl) missing.push("IA_API_BASE");

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      reason:
        "One or more required IA env vars are missing. IA sync is disabled until these are set.",
    };
  }

  return {
    ok: true,
    config: {
      apiKey,
      publisherId,
      subSiteId: subSiteId || null,
      baseUrl,
    },
  };
}

export async function POST(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok || !auth.email) {
    return auth.response!;
  }

  const ia = readIaConfig();

  if (!ia.ok) {
    // Log env-missing state, but don't throw
    try {
      await prisma.eventLog.create({
        data: {
          userId: null,
          type: "ia_sync_env_missing",
          message: "IA sync env check: missing required variables",
          detail: `Admin: ${auth.email}. Missing: ${ia.missing.join(
            ", "
          )}. Reason: ${ia.reason}`,
        },
      });
    } catch (err: any) {
      console.error("[ia-sync] failed to log env-missing event:", err?.message || err);
    }

    return NextResponse.json({
      ok: false,
      step: 3,
      phase: "env-check",
      message: ia.reason,
      missing: ia.missing,
    });
  }

  // Env looks good: log a success marker (we still do NOT hit IA API yet)
  try {
    await prisma.eventLog.create({
      data: {
        userId: null,
        type: "ia_sync_env_ok",
        message: "IA sync env check passed",
        detail: `Admin: ${auth.email}. Publisher: ${
          ia.config.publisherId
        }, SubSite: ${ia.config.subSiteId || "(none set)"}, Base: ${
          ia.config.baseUrl
        }`,
      },
    });
  } catch (err: any) {
    console.error("[ia-sync] failed to log env-ok event:", err?.message || err);
  }

  return NextResponse.json({
    ok: true,
    step: 3,
    phase: "env-check",
    message:
      "IA env configuration looks good. Safe to wire real IA API calls in the next step.",
    hasSubSiteId: ia.config.subSiteId !== null,
  });
}

// Optional: allow simple GET test in browser (still admin-protected)
export async function GET(request: NextRequest) {
  return POST(request);
}

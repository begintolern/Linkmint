// app/s/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to build an absolute fallback URL
function fallbackUrl(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = "/dashboard/links";
  url.search = "";
  return url;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get("u");

    // Fast path: if the creator provided ?u=<destination>, just go there
    if (u) {
      try {
        // Validate it's a proper http(s) URL before redirecting
        const parsed = new URL(u);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return NextResponse.redirect(parsed.toString(), 302);
        }
      } catch {
        // fall through to DB attempt / fallback
      }
    }

    // Optional: DB lookup by short code (no-throw/no-type assumptions)
    const code = ctx.params?.id;
    if (code && (prisma as any).smartLink?.findUnique) {
      try {
        const rec = await (prisma as any).smartLink.findUnique({
          where: { code },
          select: { destinationUrl: true },
        });
        if (rec?.destinationUrl) {
          return NextResponse.redirect(rec.destinationUrl as string, 302);
        }
      } catch {
        // If schema/model isn't there yet, ignore and fall back
      }
    }

    // Fallback: take them to their Links page
    return NextResponse.redirect(fallbackUrl(req));
  } catch {
    return NextResponse.redirect(fallbackUrl(req));
  }
}

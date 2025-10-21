// app/api/policy-check/log/route.ts
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function parseBody(text: string) {
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    // allow naive form-ish payloads later if needed
    return {};
  }
}

export async function POST(req: Request) {
  const h = headers();
  const jar = cookies();

  // raw body so we’re not strict about content-type
  const raw = await req.text();
  const body = parseBody(raw);

  // accept either flat shape or { data: { ... } }
  const src: any = (body && typeof body === "object" && "data" in body) ? (body as any).data : body;

  const engine = typeof src?.engine === "string" ? src.engine : "unknown";
  const severity = typeof src?.severity === "string" ? src.severity : "NONE";
  const categories = Array.isArray(src?.categories) ? (src.categories as any[]).map(String) : [];
  const sampleText = typeof src?.sampleText === "string" ? src.sampleText : "";

  // minimal validation: require at least one of engine/sampleText
  if (!engine && !sampleText) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  // meta
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  const userAgent = h.get("user-agent") || null;
  const userId = jar.get("userId")?.value || null;

  try {
    const rec = await prisma.policyCheckLog.create({
      data: {
        engine,
        severity,
        categories,
        sampleText,
        inputChars: sampleText.length,
        ip,
        userAgent,
        userId,
      },
      select: { id: true, createdAt: true, severity: true },
    });

    return NextResponse.json({ ok: true, id: rec.id, at: rec.createdAt, severity: rec.severity });
  } catch (e: any) {
    console.error("[policy-check/log] create error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

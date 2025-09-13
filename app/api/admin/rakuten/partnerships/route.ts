// app/api/admin/rakuten/partnerships/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { listPartnerships } from "@/lib/partners/rakutenClient";

// ⬇️ IMPORTANT: Update this import to where your NextAuth authOptions are exported.
// Examples you might have in your repo:
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { authOptions } from "@/lib/auth";
// import { authOptions } from "@/server/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function normalizeStatus(raw: string | null): "PENDING" | "APPROVED" | "DECLINED" | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v === "pending") return "PENDING";
  if (v === "approved") return "APPROVED";
  if (v === "declined") return "DECLINED";
  return undefined;
}

function isAdmin(session: any): boolean {
  const role = session?.user?.role?.toString()?.toLowerCase?.();
  if (role === "admin") return true;

  // Optional: allowlist fallback via env (comma-separated emails)
  const email = session?.user?.email?.toString()?.toLowerCase?.();
  const allow = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return email ? allow.includes(email) : false;
}

export async function GET(req: Request) {
  try {
    // 1) AuthN/AuthZ gate
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // 2) Params
    const url = new URL(req.url);
    const status = normalizeStatus(url.searchParams.get("status")); // APPROVED|PENDING|DECLINED|undefined
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 20);

    // 3) Call Rakuten
    const data = await listPartnerships({ status, page, pageSize });

    // 4) Return
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    const message = err?.message || "Failed to load partnerships";
    return NextResponse.json({ error: "internal_error", message }, { status: 500 });
  }
}

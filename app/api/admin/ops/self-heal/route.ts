// app/api/admin/ops/self-heal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { runSelfHeal } from "@/lib/ops/selfHeal";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  const adminId = process.env.ADMIN_USER_ID || "clwzud5zr0000v4l5gnkz1oz3";

  if (!session?.user?.id || session.user.id !== adminId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json();
    const result = await runSelfHeal(action);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "SELF_HEAL_API_ERROR" },
      { status: 500 }
    );
  }
}

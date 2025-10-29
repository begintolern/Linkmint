// app/api/admin/db-tables/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "clwzud5zr0000v4l5gnkz1oz3";

type AdminSession =
  | { user?: { id?: string; role?: string; email?: string | null } | null }
  | null;

async function requireAdmin() {
  const session = (await getServerSession(authOptions as any)) as AdminSession;
  const uid = session?.user?.id;
  const role = session?.user?.role;
  if (uid && (uid === ADMIN_USER_ID || role === "admin")) return true;
  return false;
}

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.$queryRaw<
    { table_schema: string; table_name: string; column_name: string; data_type: string }[]
  >`
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;

  return NextResponse.json({ ok: true, rows });
}

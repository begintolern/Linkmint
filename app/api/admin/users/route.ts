// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ✅ Use the v4 helper directly
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    // Cast to dodge v4/v5 signature mismatch in some TS setups
    const session = await (getServerSession as any)(authOptions);

    if (!session || !(session as any).user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Enforce admin
    const role = (session as any).user?.role ?? "USER";
    if (role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error("Admin users route error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

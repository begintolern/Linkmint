// app/api/me/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await (getServerSession as any)(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Return minimal safe info
    return NextResponse.json({
      success: true,
      user: {
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role ?? "USER",
      },
    });
  } catch (err) {
    console.error("me route error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

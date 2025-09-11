import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as any).role,
      disabled: (session.user as any).disabled,
    },
  });
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ ok: false, message: "Missing token." }, { status: 400 });
    }

    // Look up user by verifyToken and ensure not expired
    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiry: { gt: new Date() },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired token." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    // Optional: redirect to a pretty success page instead of JSON
    // return NextResponse.redirect(new URL("/login?verified=1", req.url));

    return NextResponse.json({ ok: true, message: "Email verified. You can log in now." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

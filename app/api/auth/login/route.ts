import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const Schema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Comma-separated admin emails in .env, e.g.:
// ALLOWED_ADMIN_EMAILS="you@linkmint.co, cofounder@linkmint.co"
function isAdminEmail(email: string): boolean {
  const raw = process.env.ALLOWED_ADMIN_EMAILS || "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || "Invalid login data.";
      return NextResponse.json({ ok: false, message: msg }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Require email verification before login
    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        { ok: false, message: "Please verify your email before logging in." },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true, message: "Logged in." });

    // Minimal cookie-based role flag for /admin guard
    const role = isAdminEmail(email) ? "admin" : "user";

    // NOTE: In production, also set a proper session/JWT cookie.
    // Here we only set a role cookie because your /admin/layout.tsx checks this.
    res.cookies.set("role", role, {
      httpOnly: true,
      secure: true, // set false only if strictly needed in local HTTP
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Optional convenience cookie for UI (non-httpOnly)
    res.cookies.set("email", email, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

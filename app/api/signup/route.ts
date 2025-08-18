// app/api/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail"; // named import (email, token)

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const normalized = String(email).toLowerCase().trim();

    // 1) reject if user exists
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: false, error: "account_exists" }, { status: 409 });
    }

    // 2) create user
    const hash = await bcrypt.hash(String(password), 10);
    const verifyToken = uuidv4();
    const verifyTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const user = await prisma.user.create({
      data: {
        email: normalized,
        name: name ?? null,
        password: hash,
        emailVerifiedAt: null,
        verifyToken,
        verifyTokenExpiry,
        role: "user",
        trustScore: 0,
      },
      select: { id: true, email: true },
    });

    // 3) fire-and-forget email (never block signup on email failure)
    (async () => {
      try {
        await sendVerificationEmail(user.email, verifyToken);
      } catch (e) {
        console.error("[signup] email send failed:", e);
      }
    })();

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    console.error("[signup] ERROR", err);
    return NextResponse.json({ ok: false, error: "signup_failed" }, { status: 500 });
  }
}

// app/api/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail"; // <-- default import, (email, token)

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const normalized = String(email).toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, emailVerifiedAt: true },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "Account already exists." }, { status: 409 });
    }

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

    // matches (email, token)
    await sendVerificationEmail(user.email, verifyToken);

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[signup] ERROR", err);
    return NextResponse.json({ success: false, error: "Signup failed. Try again later." }, { status: 500 });
  }
}

// app/api/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { email, password, name, referredById } = data;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create verification token (30-minute expiry)
    const verifyToken = uuidv4();
    const verifyTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    // 4. Create user in DB
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        referredById: referredById || null,
        verifyToken,
        verifyTokenExpiry,
        trustScore: 0,
      },
    });

    // 5. Send verification email
    await sendVerificationEmail(email, verifyToken);

    return NextResponse.json({
      success: true,
      message: "Signup successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

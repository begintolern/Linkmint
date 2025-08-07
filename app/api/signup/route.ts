// app/api/signup/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";
import { sendTelegramAlert } from "@/lib/telegram/notify";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { email, password, name, referredById } = data;

    console.log("Signup payload:", { email, name, referredById });

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create verification token
    const verifyToken = uuidv4();
    const verifyTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 4. Resolve referrer ID if it's an email
    let referrerUserId: string | null = null;

    if (referredById && referredById.includes("@")) {
      const refUser = await prisma.user.findUnique({
        where: { email: referredById },
      });
      if (refUser) {
        referrerUserId = refUser.id;
      }
    } else {
      referrerUserId = referredById;
    }

    // 5. Get referral group ID if referrer exists
    let referralGroupId: string | null = null;

    if (referrerUserId) {
      const referrer = await prisma.user.findUnique({
        where: { id: referrerUserId },
        include: { referralGroup: true },
      });

      if (referrer?.referralGroup?.id) {
        referralGroupId = referrer.referralGroup.id;
      }
    }

    // 6. Create the new user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        referralCode: uuidv4(),
        verifyToken,
        verifyTokenExpiry,
        referredById: referrerUserId,
        referralGroupId,
      },
    });

    // 7. Send verification email
    await sendVerificationEmail(newUser.email, verifyToken);

    // 8. Telegram alert to admin
    if (referrerUserId) {
      const referrer = await prisma.user.findUnique({
        where: { id: referrerUserId },
      });

      if (referrer) {
        await sendTelegramAlert(
          `👥 New referral: ${email} signed up via ${referrer.email}`
        );
      }
    }

    // 9. If user is not referred, create new referral group
    if (!referrerUserId) {
      await prisma.referralGroup.create({
        data: {
          referrer: { connect: { id: newUser.id } },
          users: { connect: { id: newUser.id } },
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

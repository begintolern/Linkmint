// app/api/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * POST /api/signup
 * Body: { name: string, email: string, password: string, ref?: string }
 * Also accepts ?ref=... on the request URL.
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const queryRef = url.searchParams.get("ref") || undefined;

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").toString().trim();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const bodyRef = (body?.ref ?? "").toString().trim() || undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Enforce unique email
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Figure out referrer (supports either user.id or user.referralCode)
    const refInput = bodyRef || queryRef;
    let referredById: string | null = null;
    let referralGroupId: string | null = null;

    if (refInput) {
      // Try by ID first (links like ?ref=<userId>)
      let referrer =
        (await prisma.user.findUnique({
          where: { id: refInput },
          select: { id: true, referralGroupId: true },
        })) ||
        // Fallback: try by referralCode column if used
        (await prisma.user.findUnique({
          where: { referralCode: refInput },
          select: { id: true, referralGroupId: true },
        }));

      if (referrer) {
        referredById = referrer.id;
        referralGroupId = referrer.referralGroupId ?? null;
      }
      // If no referrer found, we intentionally leave both as null.
      // This prevents FK violations like `User_referredById_fkey`.
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashed,
        // generate a fresh referralCode if you use codes
        // (safe even if you don't consume it elsewhere)
        referralCode: cryptoRandom(16),
        referredById, // null if no valid referrer -> avoids FK error
        referralGroupId, // null if referrer has no group
        trustScore: 0,
        emailVerified: false,
        createdAt: new Date(),
      },
      select: { id: true, email: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    // Prisma unique constraint for email
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Simple URL-safe random string for referralCode */
function cryptoRandom(len = 16): string {
  // Avoid Node crypto import to keep it simple/compatible
  const bytes = new Uint8Array(len);
  // @ts-ignore
  (globalThis.crypto || require("crypto").webcrypto).getRandomValues(bytes);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

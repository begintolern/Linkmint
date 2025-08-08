// app/api/verify-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Row = { id: string; email: string };

async function verifyTokenCore(token: string) {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT "id", "email"
    FROM "User"
    WHERE lower("verifyToken") = lower(${token})
      AND "verifyTokenExpiry" > NOW()
    LIMIT 1
  `;

  const match = rows[0];
  if (!match) {
    return { ok: false as const, error: "Invalid or expired token" };
  }

  await prisma.user.update({
    where: { id: match.id },
    data: {
      emailVerified: true,   // <-- boolean per your schema
      verifyToken: null,
      verifyTokenExpiry: null,
    },
  });

  return { ok: true as const };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token ?? body?.verifyToken;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token missing" }, { status: 400 });
    }

    const res = await verifyTokenCore(token);
    if (!res.ok) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-email POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") ?? searchParams.get("verifyToken");
    if (!token) {
      return NextResponse.json({ error: "Token missing" }, { status: 400 });
    }

    const res = await verifyTokenCore(token);
    if (!res.ok) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-email GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { getOrSetDeviceId, normalizePin, hashPin, sanitizeDeviceName } from "@/lib/pin";

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { pin, deviceName } = await req.json();
    const cleanPin = normalizePin(pin);      // must be 4–6 digits
    const pinHash = await hashPin(cleanPin); // bcrypt
    const deviceId = getOrSetDeviceId();     // sets httpOnly cookie if missing

    const saved = await prisma.pinCredential.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: { pinHash, deviceName: sanitizeDeviceName(deviceName) },
      create: { userId, deviceId, deviceName: sanitizeDeviceName(deviceName), pinHash },
      select: { id: true, deviceId: true, deviceName: true, lastUsedAt: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, device: saved });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad request" }, { status: 400 });
  }
}

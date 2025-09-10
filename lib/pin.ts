import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";

export function normalizePin(pin: string) {
  const s = String(pin || "").trim();
  if (!/^\d{4,6}$/.test(s)) throw new Error("PIN must be 4–6 digits");
  return s;
}

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash);
}

export function getOrSetDeviceId(): string {
  const c = cookies();
  let id = c.get("deviceId")?.value;
  if (!id) {
    id = crypto.randomBytes(16).toString("hex");
    c.set("deviceId", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  return id;
}

export function sanitizeDeviceName(s?: string | null) {
  const v = (s ?? "").slice(0, 80).trim();
  return v || "This device";
}

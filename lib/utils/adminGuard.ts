// lib/utils/adminGuard.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export function isProd() {
  return process.env.NODE_ENV === "production";
}

export function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "admin@linkmint.co";
  return new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

export async function assertProdAdmin(): Promise<
  | { ok: true }
  | { ok: false; status: number; error: string }
> {
  if (!isProd()) return { ok: true };
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const admins = parseAdminEmails();
  if (!email || !admins.has(email)) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true };
}

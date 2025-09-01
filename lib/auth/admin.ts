// lib/auth/admin.ts
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

/**
 * Allow-list admin guard using ADMIN_EMAILS (comma-separated) env.
 * Usage (server only): const { session, email } = await requireAdmin();
 */
export async function requireAdmin(): Promise<{ session: Session; email: string }> {
  const raw = await getServerSession(authOptions);
  const session = (raw as Session) ?? ({} as Session);
  const email = (session?.user as any)?.email as string | undefined;

  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const ok = !!email && allow.includes(email.toLowerCase());
  if (!ok) {
    redirect("/dashboard");
  }
  return { session, email: email! };
}

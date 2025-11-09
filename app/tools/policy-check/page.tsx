// app/tools/policy-check/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import PolicyCheckClient from "./PolicyCheckClient";

// Prevent indexing
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function Page() {
  // 1) Check NextAuth session for admin role
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role?.toString().toLowerCase();

  // 2) Fallback: allow if admin_key cookie equals ADMIN_API_KEY (ops access)
  const jar = cookies();
  const adminKeyCookie = jar.get("admin_key")?.value || "";
  const adminKeyEnv = process.env.ADMIN_API_KEY || "";
  const hasAdminKey = adminKeyCookie && adminKeyEnv && adminKeyCookie === adminKeyEnv;

  if (!(role === "admin" || hasAdminKey)) {
    notFound();
  }

  return <PolicyCheckClient />;
}

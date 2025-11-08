// app/tools/policy-check/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PolicyCheckClient from "./PolicyCheckClient";

// ⬇️ Prevent indexing in Google / other crawlers
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function Page() {
  // Gate access (allow admin via role cookie OR admin_key)
  const jar = cookies();
  const role = (jar.get("role")?.value || "").toLowerCase();
  const hasAdminKey = !!jar.get("admin_key")?.value;

  // ✅ Allow when running locally (NODE_ENV !== "production")
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev && !(role === "admin" || hasAdminKey)) {
    notFound();
  }

  return <PolicyCheckClient />;
}

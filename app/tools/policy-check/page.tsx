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
  // Restrict to admin only
  const role = (cookies().get("role")?.value || "").toLowerCase();
  if (role !== "admin") {
    notFound();
  }

  return <PolicyCheckClient />;
}

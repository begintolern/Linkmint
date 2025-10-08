// app/api/dev/login/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Dev-only helper to set dashboard session cookies.
 * Usage:
 *   /api/dev/login?email=you@example.com&userId=U123&role=admin
 *   /api/dev/login?email=you@example.com&userId=U123        (defaults role=user)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "";
  const userId = url.searchParams.get("userId") || "";
  const role = (url.searchParams.get("role") || "user").toLowerCase();

  if (!email || !userId) {
    return NextResponse.json(
      { ok: false, error: "Provide ?email= and ?userId=" },
      { status: 400 }
    );
  }

  const res = NextResponse.redirect(new URL("/dashboard", url.origin));
  // set simple, readable cookies used by /dashboard and API guards
  res.cookies.set("email", email, { httpOnly: false, path: "/" });
  res.cookies.set("userId", userId, { httpOnly: false, path: "/" });
  res.cookies.set("role", role === "admin" ? "admin" : "user", { httpOnly: false, path: "/" });
  return res;
}

// lib/admin/auth.ts
import { headers } from "next/headers";

type AdminAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function requireAdmin(req?: Request): Promise<AdminAuthResult> {
  // Read configured key (trim to avoid newline/space issues)
  const configured = (process.env.ADMIN_KEY ?? "").trim();

  if (!configured) {
    return {
      ok: false,
      status: 500,
      error:
        "Missing ADMIN_KEY on server. Set it in .env.local (dev) or Railway env (prod).",
    };
  }

  // Pull the incoming key from header OR ?key= query (handy for quick curl tests)
  let incoming: string | null = null;

  if (req) {
    incoming =
      req.headers.get("x-admin-key") ??
      new URL(req.url).searchParams.get("key");
  } else {
    const h = headers();
    incoming = h.get("x-admin-key");
  }

  if ((incoming ?? "").trim() !== configured) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}

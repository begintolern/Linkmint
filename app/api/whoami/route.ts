// app/api/whoami/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

type WhoAmIResponse =
  | {
      ok: true;
      user: {
        id?: string | null;
        email?: string | null;
        name?: string | null;
        role?: string | null;
      };
    }
  | { ok: false; error: string };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Avoid `in` — guard with typeof/object checks
    const hasUser =
      session != null &&
      typeof session === "object" &&
      (session as any).user != null;

    if (!hasUser) {
      return NextResponse.json<WhoAmIResponse>(
        { ok: false, error: "NO_SESSION" },
        { status: 200 }
      );
    }

    const u = (session as any).user ?? {};
    const id = typeof u.id === "string" ? u.id : null;
    const email = typeof u.email === "string" ? u.email : null;
    const name = typeof u.name === "string" ? u.name : null;
    const role = typeof u.role === "string" ? u.role : null;

    return NextResponse.json<WhoAmIResponse>({
      ok: true,
      user: { id, email, name, role },
    });
  } catch {
    return NextResponse.json<WhoAmIResponse>(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

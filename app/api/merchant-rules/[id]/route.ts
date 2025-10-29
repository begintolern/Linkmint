// app/api/merchant-rules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    // Hard admin gate (throws 401/403 as needed)
    await requireAdmin();

    const id = ctx.params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    // Ensure the record exists before delete (optional but clearer errors)
    const existing = await prisma.merchantRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    await prisma.merchantRule.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    // If requireAdmin threw a Response, return it
    if (err instanceof Response) return err;
    console.error("merchant-rules/[id] DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

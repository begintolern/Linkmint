// app/r/[code]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const inviter = await prisma.user.findUnique({
    where: { referralCode: params.code },
    select: { id: true },
  });

  // Redirect target (homepage for now)
  const redirectUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://linkmint.co";

  const res = NextResponse.redirect(redirectUrl);

  // If valid inviter, set a cookie so signup can read it later
  if (inviter) {
    res.cookies.set("lm_ref", params.code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 60, // 60 days
    });
  }

  return res;
}

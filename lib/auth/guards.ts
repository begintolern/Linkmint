// lib/auth/guards.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export type Viewer = {
  id: string | null;
  email: string | null;
  role: "admin" | "user";
  region?: string | null; // optional; derive elsewhere if needed
};

// Centralized admin check (server-side, cannot be bypassed)
export async function requireAdmin(): Promise<Viewer> {
  const session = await getServerSession(authOptions as any);
  const email = (session as any)?.user?.email || null;

  if (!email) throw new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true }, // no region in schema
  });

  if (!user || (user.role as any) !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return {
    id: user.id,
    email: user.email,
    role: "admin",
    region: null, // fill from cookie/profile if you add it later
  };
}

// Soft check: returns viewer; caller decides behavior for non-admin
export async function getViewer(): Promise<Viewer> {
  const session = await getServerSession(authOptions as any);
  const email = (session as any)?.user?.email || null;

  if (!email) {
    return { id: null, email: null, role: "user", region: null };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true }, // no region in schema
  });

  if (!user) return { id: null, email, role: "user", region: null };

  return {
    id: user.id,
    email: user.email,
    role: (user.role as any) === "admin" ? "admin" : "user",
    region: null,
  };
}

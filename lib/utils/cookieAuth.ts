// lib/utils/cookieAuth.ts
import { cookies } from "next/headers";

export type AuthUser = {
  id: string;
  email: string;
  role: "user" | "admin";
};

export function getAuthUser(): AuthUser | null {
  const store = cookies();
  const id = store.get("userId")?.value || "";
  const email = store.get("email")?.value || "";
  const roleRaw = (store.get("role")?.value || "user").toLowerCase();
  const role: "user" | "admin" = roleRaw === "admin" ? "admin" : "user";

  if (!id || !email) return null;
  return { id, email, role };
}

export function requireUser(): AuthUser {
  const user = getAuthUser();
  if (!user) {
    const err = new Error("Unauthorized");
    // @ts-ignore add status for route handlers
    (err as any).status = 401;
    throw err;
  }
  return user;
}

export function requireAdmin(): AuthUser {
  const user = getAuthUser();
  if (!user) {
    const err = new Error("Unauthorized");
    // @ts-ignore
    (err as any).status = 401;
    throw err;
  }
  if (user.role !== "admin") {
    const err = new Error("Forbidden");
    // @ts-ignore
    (err as any).status = 403;
    throw err;
  }
  return user;
}

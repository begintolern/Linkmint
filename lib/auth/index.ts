// lib/auth/index.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export async function auth() {
  return await getServerSession(authOptions);
}

// lib/utils.ts

import bcryptjs from 'bcryptjs';
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcryptjs.hash(password, saltRounds);
}

export function generateReferralCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

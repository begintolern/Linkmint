// lib/auth.ts

import bcryptjs from "bcryptjs";

/**
 * Hashes a plain text password using bcryptjsjs.
 * @param password - The plain text password.
 * @returns The hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password.
 * @param hashedPassword - The hashed password.
 * @returns True if the password matches, false otherwise.
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

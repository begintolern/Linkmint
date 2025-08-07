export function generateToken(): string {
  return crypto.randomUUID(); // built-in Node 16+
}

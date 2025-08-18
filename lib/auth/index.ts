// lib/auth/index.ts
import { getServerSession as _getServerSession } from "next-auth/next";
import { authOptions } from "./options";

/**
 * Server-side session helper.
 * Wraps getServerSession to avoid v4/v5 typing quirks.
 */
export async function auth() {
  // Cast only to quiet TS in mixed envs; runtime is correct (v4 helper).
  return (_getServerSession as any)(authOptions);
}

// Also export default, so both `import { auth }` and `import auth` work.
export default auth;

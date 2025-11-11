// app/_providers/SessionProviderClient.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function SessionProviderClient({ children }: { children: ReactNode }) {
  // Keep this a thin wrapper only; no “not signed in” UI here.
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
    </SessionProvider>
  );
}

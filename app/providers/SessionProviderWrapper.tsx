// app/providers/SessionProviderWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function SessionProviderWrapper({ children }: { children: ReactNode }) {
  // No client-side gating or status messages; server-side guards handle auth.
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
    </SessionProvider>
  );
}

// components/SessionWrapper.tsx
"use client";
import { ReactNode } from "react";

export default function SessionWrapper({ children }: { children: ReactNode }) {
  // No client-side session gating here; server already enforces auth.
  return <>{children}</>;
}

"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

export default function Providers({ children }: Props) {
  // You can pass session via props later if needed
  return <SessionProvider>{children}</SessionProvider>;
}

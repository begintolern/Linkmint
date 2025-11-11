// components/dashboard/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-gray-600 hover:text-red-600 transition-colors"
    >
      Log out
    </button>
  );
}

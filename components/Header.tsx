"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const name = session?.user?.name ?? session?.user?.email ?? "there";

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* left: brand domain (optional, can hide on mobile) */}
        <div className="text-sm text-gray-500 hidden sm:block">linkmint.co</div>

        {/* center: logo/title */}
        <Link href={isAuthed ? "/dashboard" : "/"} className="text-lg font-semibold">
          Linkmint
        </Link>

        {/* right: auth state */}
        <div className="flex items-center gap-3">
          {isAuthed ? (
            <>
              <span className="hidden sm:block text-sm text-gray-600">Hi, {name.split("@")[0]}</span>
              <button
                className="rounded-md bg-red-500 px-3 py-1.5 text-white text-sm hover:bg-red-600"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:underline">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

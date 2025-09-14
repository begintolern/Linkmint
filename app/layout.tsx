// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "linkmint.co",
  description:
    "Turn any link into a payout. Share links you already love — earn automatically after approvals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read cookies server-side (set by your login route)
  const store = cookies();
  const email = store.get("email")?.value || null; // presence means "logged in"
  const role = store.get("role")?.value || "user"; // "admin" or "user"

  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <Header isLoggedIn={!!email} isAdmin={role === "admin"} />
        {children}
      </body>
    </html>
  );
}

function Header({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          linkmint.co
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
              <Link href="/logout" className="hover:underline">
                Logout
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/signup" className="hover:underline">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

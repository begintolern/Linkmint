// components/AdminHeader.tsx
import Link from "next/link";
import { cookies } from "next/headers";

export default function AdminHeader() {
  const store = cookies();
  const email = store.get("email")?.value || null;
  const role = store.get("role")?.value || "user";
  const isLoggedIn = !!email;
  const isAdmin = role === "admin";

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/admin" className="font-semibold">
        Admin Dashboard
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        {isLoggedIn ? (
          <>
            <span className="text-gray-500 hidden sm:inline">{email}</span>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            {isAdmin && <Link href="/admin" className="hover:underline">Admin</Link>}
            <Link href="/logout" className="hover:underline">Logout</Link>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/signup" className="hover:underline">Sign Up</Link>
          </>
        )}
      </nav>
    </div>
  );
}

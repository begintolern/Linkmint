// app/admin/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the new admin access page
    router.replace("/admin/enter-key");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting…</h1>
        <p className="text-sm text-gray-600">
          Admin login has been replaced by key-based access. <br />
          You’ll be redirected to{" "}
          <span className="font-medium text-blue-600">/admin/enter-key</span> automatically.
        </p>
      </div>
    </main>
  );
}

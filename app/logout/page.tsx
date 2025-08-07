// app/logout/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await fetch("/api/logout", {
        method: "POST",
      });

      router.push("/login"); // 👈 Redirect to login after logout
    };

    logout();
  }, [router]);

  return (
    <div className="p-6 text-lg text-gray-600">
      Logging out...
    </div>
  );
}

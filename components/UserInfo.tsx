// components/UserInfo.tsx
"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name?: string;
  trustScore?: number;
};

export default function UserInfo() {
  const [user, setUser] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data);
        } else {
          setErrorMsg(data.error);
        }
      })
      .catch((err) => {
        setErrorMsg(err?.message ?? "Failed to fetch user info");
      });
  }, []);

  if (errorMsg) {
    return (
      <div className="text-sm text-red-600">
        {errorMsg}
      </div>
    );
  }

  if (!user) {
    return <div className="text-sm text-gray-600">Loading user info…</div>;
  }

  return (
    <div className="rounded border p-4 bg-white">
      <h3 className="font-semibold mb-2">User Info</h3>
      <p className="text-sm">Name: {user.name ?? "N/A"}</p>
      <p className="text-sm">Email: {user.email}</p>
      <p className="text-sm">Trust Score: {user.trustScore ?? 0}</p>
    </div>
  );
}

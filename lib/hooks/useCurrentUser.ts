"use client";

import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, loading };
}

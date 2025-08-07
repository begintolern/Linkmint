'use client';

import { useEffect, useState } from 'react';

export default function UserInfo() {
  const [user, setUser] = useState<{ email: string; referralBadge: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUser(data);
      });
  }, []);

  if (!user) return null;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded">
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Referral Badge:</strong> {user.referralBadge ?? 'None'}</p>
    </div>
  );
}

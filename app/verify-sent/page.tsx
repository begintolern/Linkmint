// app/verify-sent/page.tsx
"use client";

import Link from "next/link";

export default function VerifySentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-4">Verify Your Email</h2>
        <p className="mb-4 text-gray-700">
          We've sent a verification link to your email. Please check your inbox (and spam folder)
          and click the link to activate your account.
        </p>
        <p className="mb-6 text-sm text-gray-500">
          You won’t be able to log in or earn until your email is verified.
        </p>
        <Link href="/login" className="text-blue-600 underline">
          Return to login
        </Link>
      </div>
    </div>
  );
}

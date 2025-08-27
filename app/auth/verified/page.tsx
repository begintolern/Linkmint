export const dynamic = "force-dynamic";

import Link from "next/link";

export default function VerifiedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
        <div className="text-3xl font-semibold">Email verified 🎉</div>
        <p className="mt-3 text-slate-600">
          Your account is ready. You can log in and start using linkmint.co.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-black text-white hover:opacity-90"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

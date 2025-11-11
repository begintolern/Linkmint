import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-800">
      <section className="text-center max-w-2xl px-6">
        <h1 className="text-3xl sm:text-5xl font-bold text-teal-700 mb-6">
          Turn your shares into income — every link can earn.
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Linkmint helps you earn small commissions by sharing smart affiliate
          links. Transparent, ethical, and built for Filipino creators and everyday users.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Log in to Dashboard
          </Link>
          <Link
            href="/tutorial"
            className="border border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            How it works
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          © {new Date().getFullYear()} linkmint.co — all rights reserved.
        </p>
      </section>
    </main>
  );
}

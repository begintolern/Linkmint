import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()} linkmint.co — All rights reserved.
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/terms" className="text-gray-700 hover:underline">
            Terms of Service
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="text-gray-700 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/trust" className="text-gray-700 hover:underline">
            Trust Center
          </Link>
          <span className="text-gray-300">|</span>
          <a
            href="mailto:admin@linkmint.co"
            className="text-gray-700 hover:underline"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}

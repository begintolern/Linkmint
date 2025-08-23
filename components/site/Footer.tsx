export default function Footer() {
  return (
    <footer className="mt-10 border-t">
      <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <a className="hover:underline" href="/about">About</a>
          <a className="hover:underline" href="/contact">Contact</a>
          <a className="hover:underline" href="/disclosure">Disclosure</a>
          <a className="hover:underline" href="/payouts">Payouts</a>
          <a className="hover:underline" href="/privacy">Privacy</a>
          <a className="hover:underline" href="/terms">Terms</a>
        </nav>
        <div className="text-gray-400">
          © {new Date().getFullYear()} Linkmint
        </div>
      </div>
    </footer>
  );
}

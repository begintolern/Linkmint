// app/components/FooterDisclosure.tsx
export default function FooterDisclosure() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-600">
        <p className="mb-2">
          <strong>Affiliate disclosure:</strong> linkmint.co may earn a commission when you click
          links or make purchases through our smart links. This helps keep the platform free to use.
        </p>
        <p>
          Learn more on our{" "}
          <a href="/disclosure" className="underline hover:no-underline">
            full disclosure page
          </a>
          . For privacy and terms, see{" "}
          <a href="/policy" className="underline hover:no-underline">Privacy</a> and{" "}
          <a href="/terms" className="underline hover:no-underline">Terms</a>.
        </p>
      </div>
    </footer>
  );
}

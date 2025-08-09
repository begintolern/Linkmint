export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-slate-700">
        By using Linkmint, you agree to comply with applicable laws and our policies against spam and fraud.
        We may suspend accounts for abuse or policy violations.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Key points</h2>
      <ul className="mt-2 list-disc pl-6 text-slate-700">
        <li>No spam, bot traffic, or misleading claims</li>
        <li>Payment timelines may vary by partner approval</li>
        <li>We may reverse payouts on confirmed fraud</li>
      </ul>
      <p className="mt-8 text-sm text-slate-500">Last updated {new Date().toLocaleDateString()}.</p>
    </main>
  );
}

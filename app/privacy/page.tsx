export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-slate-700">
        We collect basic account info (email, name) and usage data required to operate Linkmint.
        We do not sell personal data. We use cookies to attribute clicks and purchases.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Data we collect</h2>
      <ul className="mt-2 list-disc pl-6 text-slate-700">
        <li>Account: email, name</li>
        <li>Usage: link clicks, conversion events, payout history</li>
        <li>Logs: security and fraud checks</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Your controls</h2>
      <ul className="mt-2 list-disc pl-6 text-slate-700">
        <li>Email preferences and opt‑outs</li>
        <li>Account deletion by request: <a className="underline" href="mailto:admin@linkmint.co">admin@linkmint.co</a></li>
      </ul>
      <p className="mt-8 text-sm text-slate-500">Last updated {new Date().toLocaleDateString()}.</p>
    </main>
  );
}

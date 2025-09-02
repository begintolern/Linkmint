// components/site/Footer.tsx
export default function Footer() {
  return (
    <footer className="mt-16 border-t py-6 text-center text-sm text-slate-600">
      <a href="/referrals" className="underline hover:text-slate-900">
        Referral Program
      </a>
      {" · "}
      <a href="/trust-center" className="underline hover:text-slate-900">
        Trust Center
      </a>
    </footer>
  );
}

// components/site/Footer.tsx
export default function Footer() {
  return (
    <footer className="mt-16 border-t py-6 text-center text-sm text-slate-600">
      <div>
        <a href="/referrals" className="underline hover:text-slate-900">
          Referral Program
        </a>
        {" · "}
        <a href="/trust-center" className="underline hover:text-slate-900">
          Trust Center
        </a>
      </div>
      <div className="mt-2 text-slate-500">
        © {new Date().getFullYear()} linkmint.co · All rights reserved
      </div>
    </footer>
  );
}

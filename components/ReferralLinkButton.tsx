// components/ReferralLinkButton.tsx
"use client";

import * as React from "react";

type Props = {
  referralCode: string;
  baseUrl?: string;              // optional override (otherwise uses window.origin)
  style?: "path" | "query";      // /r/CODE (default) or ?ref=CODE
  className?: string;
};

export default function ReferralLinkButton({
  referralCode,
  baseUrl,
  style = "path",
  className = "",
}: Props) {
  const [copied, setCopied] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  const url = React.useMemo(() => {
    const origin =
      baseUrl ||
      (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL) ||
      "https://linkmint.co";

    return style === "query"
      ? `${origin}/?ref=${encodeURIComponent(referralCode)}`
      : `${origin}/r/${encodeURIComponent(referralCode)}`;
  }, [referralCode, baseUrl, style]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    } finally {
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 1500);
      setTimeout(() => setShowToast(false), 2200);
    }
  };

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={copyToClipboard}
          className="px-4 py-2 rounded-2xl bg-black text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition"
          aria-label="Copy referral link"
        >
          {copied ? "Copied ✓" : "Copy referral link"}
        </button>

        {/* Small monospace preview for quick manual copy if needed */}
        <span
          className="select-all text-xs text-gray-600 bg-gray-100 rounded-lg px-2 py-1 font-mono hidden sm:inline"
          title={url}
        >
          {url}
        </span>
      </div>

      {/* Lightweight toast (no external deps) */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="rounded-xl bg-black text-white/95 shadow-lg px-4 py-3 text-sm">
            Referral link copied to clipboard
          </div>
        </div>
      )}
    </>
  );
}

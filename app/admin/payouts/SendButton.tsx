"use client";

import { useState, startTransition } from "react";
import { toast } from "sonner";
import { sendPayout } from "./actions";

export default function SendButton({
  payoutId,
  amountUSD,
  receiverEmail,
}: {
  payoutId: string;
  amountUSD: number;
  receiverEmail: string | null;
}) {
  const [sending, setSending] = useState(false);

  async function onClick() {
    if (!receiverEmail) {
      toast.error("Missing receiver email on payout.");
      return;
    }

    const ok = confirm(
      `Send $${amountUSD.toFixed(2)} via PayPal to ${receiverEmail}?\n\nThis will mark the payout as PAID.`
    );
    if (!ok) return;

    setSending(true);
    try {
      const note = window.prompt("Add a note (optional):", "") || undefined;
      const res = await sendPayout(payoutId, note);
      if (!res?.ok) throw new Error("Payout action returned an error");
      toast.success("Payout sent via PayPal");
      startTransition(() => {
        // force refresh
        // @ts-ignore
        window.location = window.location;
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to send payout");
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={sending}
      className="rounded bg-black text-white px-3 py-1.5 text-sm disabled:opacity-50"
      title="Send via PayPal"
    >
      {sending ? "Sending..." : "Send via PayPal"}
    </button>
  );
}

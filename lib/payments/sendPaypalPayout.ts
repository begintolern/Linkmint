// lib/payments/sendPaypalPayout.ts
/**
 * Minimal PayPal payout "sender".
 * - In SANDBOX mode (default), this does NOT hit PayPal. It just simulates a success.
 * - You can later replace the internals with real PayPal SDK calls.
 *
 * ENV:
 *   PAYPAL_MODE=sandbox|live   (default: sandbox)
 */

export type PaypalPayoutArgs = {
  userId: string;
  email: string;         // receiver email
  amount: number;        // USD
  note?: string | null;
};

export type PaypalPayoutResult =
  | { success: true; id: string; raw?: any }
  | { success: false; error: string; raw?: any };

function isLive() {
  return (process.env.PAYPAL_MODE || "sandbox").toLowerCase() === "live";
}

// Simulate a network delay
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function sendPaypalPayout(
  args: PaypalPayoutArgs
): Promise<PaypalPayoutResult> {
  const { userId, email, amount, note } = args;

  // Guardrails
  if (!email || !amount || amount <= 0) {
    return { success: false, error: "Invalid payout args" };
  }

  // --- SANDBOX (default): simulate success ---
  if (!isLive()) {
    await sleep(300); // tiny delay for realism
    const fakeId = `sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(
      "[paypal:sandbox] payout simulated",
      { userId, email, amount, note, id: fakeId }
    );
    return { success: true, id: fakeId };
  }

  // --- LIVE: placeholder (wire actual PayPal SDK later) ---
  try {
    // TODO: integrate real PayPal Payouts SDK here.
    // For now, throw to prevent accidental live sends.
    throw new Error("LIVE mode not implemented yet");
  } catch (err: any) {
    console.error("[paypal:live] payout failure", err);
    return { success: false, error: err?.message || "PayPal live payout failed" };
  }
}

export default sendPaypalPayout;

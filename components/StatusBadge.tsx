"use client";

type Status =
  | "PENDING"
  | "APPROVED"
  | "VOIDED"
  | "REQUESTED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "ON_HOLD";

export default function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    VOIDED: "bg-red-100 text-red-800",
    REQUESTED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    CANCELED: "bg-gray-200 text-gray-700",
    ON_HOLD: "bg-amber-100 text-amber-800",
  };

  const labels: Record<Status, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    VOIDED: "Voided",
    REQUESTED: "Requested",
    PROCESSING: "Processing",
    PAID: "Paid",
    FAILED: "Failed",
    CANCELED: "Canceled",
    ON_HOLD: "On Hold",
  };

  const tooltips: Record<Status, string> = {
    PENDING:
      "Waiting for merchant approval. Most clear in 30–60 days, some up to 90.",
    APPROVED:
      "Approved and paid to Linkmint. Your share is available for payout.",
    VOIDED:
      "Voided by merchant (return/cancel/fraud). No payout is possible.",
    REQUESTED: "Payout requested. Awaiting processing.",
    PROCESSING: "Your payout is being processed.",
    PAID: "Payout sent successfully.",
    FAILED:
      "Payout failed. Please check your payout method and try again.",
    CANCELED:
      "Payout canceled. Contact support if this wasn’t intended.",
    ON_HOLD:
      "Temporarily on hold for review or additional verification.",
  };

  const cls =
    styles[status] ??
    "bg-gray-100 text-gray-800"; // fallback if an unknown status sneaks in

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${cls}`}
      title={tooltips[status] ?? labels[status]}
    >
      {labels[status] ?? status}
    </span>
  );
}

// components/merchant/MerchantStatusBadge.tsx
type Props = { status: "ACTIVE" | "PENDING" | "REJECTED" | string };

export default function MerchantStatusBadge({ status }: Props) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border";

  switch (status) {
    case "ACTIVE":
      return <span className={`${base} border-green-500/40 bg-green-50`}>Active</span>;
    case "PENDING":
      return <span className={`${base} border-amber-500/40 bg-amber-50`}>Pending</span>;
    case "REJECTED":
      return <span className={`${base} border-red-500/40 bg-red-50`}>Rejected</span>;
    default:
      return <span className={`${base} border-gray-300 bg-gray-50`}>{status}</span>;
  }
}

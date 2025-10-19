// components/AutoPayoutBadge.tsx
export default function AutoPayoutBadge({
  on,
  disbursing,
}: {
  on: boolean;
  disbursing: boolean;
}) {
  const cls =
    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold";
  const colorOn = on
    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-gray-100 text-gray-600 ring-1 ring-gray-200";

  return (
    <span className={`${cls} ${colorOn}`} title={`Disburse: ${disbursing ? "ON" : "OFF"}`}>
      <span className={`h-2 w-2 rounded-full ${on ? "bg-emerald-500" : "bg-gray-400"}`} />
      Auto-Payout {on ? "ON" : "OFF"}
      {on && (
        <span
          className={`ml-1 rounded-sm px-1 py-[1px] text-[10px] ${
            disbursing ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
          }`}
        >
          {disbursing ? "DISBURSE ON" : "DRY RUN"}
        </span>
      )}
    </span>
  );
}

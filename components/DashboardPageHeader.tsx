// components/DashboardPageHeader.tsx
export default function DashboardPageHeader({
  title,
  subtitle,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode; // ⬅️ new optional prop
}) {
  return (
    <header className="flex items-start sm:items-baseline justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        ) : null}
      </div>

      {/* Right-aligned slot for totals/badges/actions */}
      {rightSlot ? (
        <div className="flex-shrink-0">{rightSlot}</div>
      ) : null}
    </header>
  );
}

// components/DashboardPageHeader.tsx
export default function DashboardPageHeader({
  title,
  subtitle,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="flex items-start sm:items-baseline justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600">
            {subtitle}
          </p>
        ) : null}
      </div>

      {rightSlot ? (
        <div className="flex-shrink-0">
          {rightSlot}
        </div>
      ) : null}
    </header>
  );
}

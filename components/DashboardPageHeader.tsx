// components/DashboardPageHeader.tsx
export default function DashboardPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      ) : null}
    </div>
  );
}

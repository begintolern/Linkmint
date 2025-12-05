// components/DashboardCard.tsx
import Link from "next/link";

type Props = {
  href: string;
  title: string;
  subtitle: string;
  badge?: string;
};

export default function DashboardCard({ href, title, subtitle, badge }: Props) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold tracking-wide text-gray-500">
          TOOLS
        </div>
        {badge ? (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-lg sm:text-xl font-semibold text-gray-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        {subtitle}
      </p>

      {/* Bigger tap target on mobile */}
      <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 group-hover:underline">
        Open
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="transition-transform group-hover:translate-x-0.5"
        >
          <path d="M13 5l7 7-7 7M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}

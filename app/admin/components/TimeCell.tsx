"use client";

export default function TimeCell({ iso, tooltip = true }: { iso: string; tooltip?: boolean }) {
  // Browser local formatting
  const dt = new Date(iso);
  const local = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(dt);

  const title = tooltip ? `UTC: ${new Date(iso).toISOString()}` : undefined;
  return <span title={title}>{local}</span>;
}

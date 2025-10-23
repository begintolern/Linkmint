"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-600 mb-4">
        A client-side error occurred on the dashboard. You can retry safely.
      </p>
      <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto mb-4">
        {error?.message || "Unknown error"}
      </pre>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/dashboard?notour=1")}
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
        >
          Open dashboard (tour off)
        </button>
      </div>
    </div>
  );
}

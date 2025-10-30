// app/dashboard/merchants/page.tsx
import { getViewer } from "@/lib/auth/guards";
import MerchantsClient from "./MerchantsClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function MerchantsPage({ searchParams }: PageProps) {
  const viewer = await getViewer(); // { id, email, role: "admin" | "user", region?: null }
  const isAdmin = viewer.role === "admin";

  // Pass initial filters from URL to client (so it can reflect the current state in the UI)
  const region =
    typeof searchParams?.region === "string" ? searchParams!.region : "";
  const all =
    typeof searchParams?.all === "string" &&
    (searchParams!.all === "1" || searchParams!.all === "true");

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Merchants</h1>
        {isAdmin ? (
          <span className="text-xs rounded-full px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200">
            Admin view
          </span>
        ) : (
          <span className="text-xs rounded-full px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200">
            Region locked: PH
          </span>
        )}
      </header>

      <MerchantsClient
        isAdmin={isAdmin}
        initialRegion={region}
        initialAll={all}
      />
    </div>
  );
}

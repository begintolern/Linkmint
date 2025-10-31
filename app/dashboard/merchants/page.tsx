// app/dashboard/admin/merchants/page.tsx
import RegionToggle from "./RegionToggle";
import MerchantsClient from "./MerchantsClient";
import { getViewer } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminMerchantsPage() {
  const viewer = await getViewer();
  const isAdmin = viewer.role === "admin";

  // PH-only launch defaults
  const initialRegion = "PH";
  const initialAll = false;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Merchant Directory</h1>

      {/* Admin region dropdown toggle */}
      <RegionToggle />

      {/* Client handles fetching; pass the props it expects */}
      <MerchantsClient
        isAdmin={isAdmin}
        initialRegion={initialRegion}
        initialAll={initialAll}
      />
    </div>
  );
}

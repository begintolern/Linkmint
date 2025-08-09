// app/admin/page.tsx
import AutoPayoutStatusCard from "@/components/admin/AutoPayoutStatusCard";
import SystemHealthCard from "@/components/admin/SystemHealthCard";
import CommissionSummaryCard from "@/components/admin/CommissionSummaryCard";

export default function AdminPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <AutoPayoutStatusCard />
      <SystemHealthCard />
      <CommissionSummaryCard />
    </main>
  );
}

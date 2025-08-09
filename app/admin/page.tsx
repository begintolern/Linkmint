// app/admin/page.tsx
import AutoPayoutStatusCard from "@/components/admin/AutoPayoutStatusCard";

export default function AdminPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Auto Payout toggle + status */}
      <AutoPayoutStatusCard />

      {/* more cards will go here in steps 2–4 */}
    </main>
  );
}

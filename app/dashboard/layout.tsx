// app/dashboard/layout.tsx
import { ReactNode } from "react";
import SidebarNav from "@/components/dashboard/SidebarNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="rounded-xl border bg-white p-4 md:sticky md:top-4 h-fit">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Dashboard</h2>
            <SidebarNav />
          </aside>

          {/* Main content */}
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}

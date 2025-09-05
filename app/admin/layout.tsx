// app/admin/layout.tsx
export const dynamic = "force-dynamic";

import { assertAdmin } from "@/lib/utils/adminGuard";
import Sidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // gate all admin routes
  await assertAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="md:sticky md:top-6 h-max">
          <Sidebar />
        </aside>
        <section className="min-h-[60vh]">{children}</section>
      </div>
    </div>
  );
}

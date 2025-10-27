// app/admin/ops/page.tsx
import { redirect } from "next/navigation";

export default function AdminOpsRedirect() {
  redirect("/admin/ops-health");
}

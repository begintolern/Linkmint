// app/admin/ops/page.tsx
import AdminOpsClient from "./AdminOpsClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export default async function Page() {
  // Cast to any to avoid TS complaints about optional fields on session
  const session = (await getServerSession(authOptions)) as any;

  const adminId =
    process.env.ADMIN_USER_ID || "clwzud5zr0000v4l5gnkz1oz3"; // fallback

  if (!session?.user?.id || session.user.id !== adminId) {
    redirect("/");
  }

  return <AdminOpsClient />;
}

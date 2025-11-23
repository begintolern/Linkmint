// app/dashboard/discover/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import DiscoverClient from "./DiscoverClient";

export const metadata = {
  title: "Discover (AI-Assisted) | linkmint.co",
  description:
    "AI-assisted idea helper to find product ideas, categories, and merchant-friendly angles to promote on linkmint.co.",
};

export default async function DiscoverPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <DiscoverClient />;
}

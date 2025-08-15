// app/layout.tsx
import type { Metadata, Viewport } from "next";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://linkmint.co"),
  title: {
    default: "Linkmint — Earn From Every Link You Share",
    template: "%s · Linkmint",
  },
  description:
    "Turn any link into a payout. No followers needed. Built for trust.",
  keywords: ["link monetization", "affiliate", "payouts", "sharing"],
  applicationName: "Linkmint",
  alternates: { canonical: "https://linkmint.co" },
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    url: "https://linkmint.co",
    title: "Linkmint",
    description:
      "Earn from every link you share. Built for trust.",
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Linkmint — Earn From Every Link You Share",
    description:
      "Turn any link into a payout. No followers needed. Built for trust.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

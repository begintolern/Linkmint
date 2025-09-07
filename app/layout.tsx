// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/site/Footer";
import SessionProviderWrapper from "@/app/providers/SessionProviderWrapper";
import ToastProvider from "@/components/ui/ToastProvider";
import StickyHeader from "@/app/components/StickyHeader"; // ✅ add header

// Avoid stale caching during dev
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Linkmint — Earn From Every Link You Share",
    template: "%s · Linkmint",
  },
  description: "Turn any link into a payout. No followers needed. Built for trust.",
  keywords: ["link monetization", "affiliate", "payouts", "sharing"],
  applicationName: "Linkmint",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Linkmint",
    title: "Linkmint — Earn From Every Link You Share",
    description: "Earn from every link you share. Built for trust.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Linkmint preview" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@linkmint",
    title: "Linkmint — Earn From Every Link You Share",
    description: "Turn any link into a payout. No followers needed. Built for trust.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <SessionProviderWrapper>
          {/* ✅ Global sticky header with centered large logo */}
          <StickyHeader />
          <div className="min-h-screen">{children}</div>
        </SessionProviderWrapper>
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}

// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

const siteName = "linkmint.co";
const siteTitle = "Linkmint turns your shares into income — every link can earn.";
const siteDesc =
  "Create a smart link, share it anywhere, and get paid when people buy. Transparent rules, real commissions, and tools built for everyday users.";

export const metadata: Metadata = {
  metadataBase: new URL("https://linkmint.co"),
  title: {
    default: siteTitle,
    template: "%s · linkmint.co",
  },
  description: siteDesc,
  applicationName: siteName,
  keywords: [
    "affiliate",
    "smart links",
    "earn online",
    "referrals",
    "PayPal payout",
    "Linkmint",
    "linkmint.co",
  ],
  authors: [{ name: "linkmint.co" }],
  openGraph: {
    type: "website",
    url: "https://linkmint.co",
    siteName,
    title: siteTitle,
    description: siteDesc,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "linkmint.co — every link can earn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDesc,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg?v=2"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  themeColor: "#0ea5a4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

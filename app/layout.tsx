// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import FooterDisclosure from "./components/FooterDisclosure";

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
    icon: [{ url: "/favicon-2025.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon-2025.svg"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    // keep admin/tools pages out of search if needed; public pages still indexable
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5a4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* SEO: Organization schema for brand/entity trust */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Linkmint (linkmint.co)",
              url: "https://linkmint.co",
              logo: "https://linkmint.co/og-image.png",
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  email: "admin@linkmint.co",
                  areaServed: ["PH", "US"],
                  availableLanguage: ["en", "tl"],
                },
              ],
              // Add social profiles later via `sameAs`: ["https://twitter.com/…", "https://www.facebook.com/…"]
            }),
          }}
        />
      </head>
      <body>
        {children}
        <FooterDisclosure />
      </body>
    </html>
  );
}

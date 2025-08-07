// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://linkmint.co"), // Required for social previews

  title: "Linkmint – Earn From Every Link You Share",
  description: "Turn any link into a payout. No followers needed. Built for everyday earners.",
  icons: {
    icon: "/favicon.ico", // Favicon in /public folder
  },
  openGraph: {
    title: "Linkmint",
    description: "Earn from every link you share. Built for trust.",
    url: "https://linkmint.co",
    type: "website",
    images: ["/opengraph-image.png"], // Optional, can upload this later
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className}>{children}</body>
    </html>
  );
}

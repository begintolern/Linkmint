// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://linkmint.co/", changeFrequency: "weekly", priority: 1.0 },
    { url: "https://linkmint.co/login", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://linkmint.co/signup", changeFrequency: "monthly", priority: 0.7 },
    { url: "https://linkmint.co/dashboard", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://linkmint.co/trust", changeFrequency: "monthly", priority: 0.7 },
  ];
}

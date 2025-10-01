import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",   // admin panel
          "/tools",   // internal tools (policy-check, etc.)
          "/api",     // API routes
        ],
      },
    ],
    sitemap: "https://linkmint.co/sitemap.xml", // remove if you don't have one
  };
}

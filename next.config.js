// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router server runtime; do NOT statically export
  output: 'standalone',      // ✅ build a Node server, not a static export
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;

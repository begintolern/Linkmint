/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Build an independent bundle (good for Docker/Railway)
  output: "standalone",
  // Keep this minimal—.env/.env.local are auto‑loaded by Next on the server.
  // Do NOT hardcode env here.
};

module.exports = nextConfig;

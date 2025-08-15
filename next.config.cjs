/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Build a standalone output (good for Docker/Railway)
  output: 'standalone',

  // Experimental config (optional, for faster builds)
  experimental: {
    serverActions: true
  },

  webpack: (config) => {
    // Example: add custom Webpack settings if needed
    return config;
  },

  env: {
    // This will be available on both server & client
    NEXT_PUBLIC_APP_NAME: 'Linkmint',
  },

  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;

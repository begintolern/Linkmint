/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Force HTTPS everywhere (helps Google review)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          // Sensible security defaults
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          // CSP tuned to typical Next.js + PayPal flows
          { key: "Content-Security-Policy", value:
            "default-src 'self'; img-src 'self' data: https:; font-src 'self' https: data:; " +
            "style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
            "connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://www.paypal.com"
          },
        ],
      },
    ];
  },
};
export default nextConfig;

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const config: NextConfig = {
  devIndicators: false,
  experimental: { cpus: 2 },
  poweredByHeader: false,
  agentRules: false,
  turbopack: { root: process.cwd() },
  async rewrites() {
    const origin = process.env.API_ORIGIN ?? "http://127.0.0.1:5081";
    const api = new URL(origin);
    if (!["http:", "https:"].includes(api.protocol) || api.username || api.password || api.search || api.hash || api.pathname !== "/") throw new Error("API_ORIGIN must be an HTTP(S) origin");
    return [{ source: "/api/v1/:path*", destination: `${api.origin}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default createNextIntlPlugin("./src/i18n/request.ts")(config);

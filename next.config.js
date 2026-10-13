/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "assets.coingecko.com" }],
  },
  async redirects() {
    /**
     * When this deployment is acting as the API host only (`FRONTEND_URL` set),
     * page requests belong on the real frontend.
     *
     * One codebase deploys to both hosts, so without this the API host also
     * answers "/" with a second, indexable copy of the site — and, because it
     * holds every secret, a copy where someone could actually sign in and trade
     * on the API origin. Gated on the variable, so a single-deployment setup and
     * the frontend host itself are completely unaffected.
     *
     * Next evaluates this at BUILD time, so changing FRONTEND_URL needs a
     * rebuild rather than just a restart.
     */
    const frontend = (process.env.FRONTEND_URL ?? "").replace(/\/+$/, "");
    if (!frontend) return [];

    return [
      { source: "/", destination: frontend, permanent: false },
      {
        // Every page, but never the API, Next's own assets, or the static files
        // the browser fetches directly.
        source:
          "/:path((?!api/|_next/|crypto-icons/|assets/|fonts/|favicon|apple-touch-icon|robots.txt|sitemap).*)",
        destination: `${frontend}/:path`,
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

module.exports = nextConfig;


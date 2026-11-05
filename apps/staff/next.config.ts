import type { NextConfig } from "next";

const trim = (url: string) => url.replace(/\/+$/, "");

const site = trim(process.env.NEXT_PUBLIC_SITE_URL ?? "https://omniplex.gg");
const api = trim(
  process.env.NEXT_PUBLIC_API_URL ?? "https://spider.omniplex.gg",
);

const nextConfig: NextConfig = {
  transpilePackages: ["@omniplex/core", "@omniplex/ui"],

  env: {
    NEXT_PUBLIC_SITE_URL: site,
    NEXT_PUBLIC_BROWSER_API_URL: process.env.NEXT_PUBLIC_BROWSER_API_URL ?? api,
    NEXT_PUBLIC_SESSION_MODE: "header",
  },

  images: {
    unoptimized: true,
    localPatterns: [{ pathname: "/cdn/**" }, { pathname: "/brand/**" }],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.omniplex.gg", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [{ source: "/cdn/:path*", destination: `${site}/cdn/:path*` }];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "display-capture=()",
              "usb=()",
              "serial=()",
              "hid=()",
              "bluetooth=()",
              "midi=()",
              "payment=()",
              "publickey-credentials-get=()",
              "screen-wake-lock=()",
              "xr-spatial-tracking=()",
              "clipboard-read=()",
              "clipboard-write=(self)",
              "fullscreen=(self)",
              "autoplay=()",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

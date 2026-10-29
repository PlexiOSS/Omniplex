import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    localPatterns: [{ pathname: "/cdn/**" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.omniplex.gg",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/help",
        destination: "/kb",
        permanent: true,
      },
      {
        source: "/help/:category/:slug",
        destination: "/kb/:category/:slug",
        permanent: true,
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
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
              "fullscreen=*",
              "autoplay=*",
              "picture-in-picture=*",
              "encrypted-media=*",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

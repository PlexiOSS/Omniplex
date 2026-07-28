import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://omniplex.gg";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/bots/", "/servers/", "/search", "/user/"],
        disallow: ["/auth/", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

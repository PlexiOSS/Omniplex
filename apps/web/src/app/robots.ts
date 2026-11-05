import { BASE_URL } from "@omniplex/core/api/config";
import type { MetadataRoute } from "next";

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

import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/api/config";

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

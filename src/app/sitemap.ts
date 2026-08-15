import type { MetadataRoute } from "next";
import { bots, servers } from "@/lib/api";
import { BASE_URL } from "@/lib/api/config";
import { getLegalDocuments } from "@/lib/legal/content";

export const revalidate = 3600; // re-generate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/bots`,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/servers`,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/search`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/legal`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...getLegalDocuments().map((doc) => ({
      url: `${BASE_URL}/legal/${doc.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  // Fetch first page of bots and servers for dynamic URLs.
  // More pages are intentionally omitted to keep sitemap lean —
  // search engines will crawl paginated content via links.
  const [botList, serverList] = await Promise.allSettled([
    bots.getAll(1),
    servers.getAll(1),
  ]);

  const botUrls: MetadataRoute.Sitemap =
    botList.status === "fulfilled"
      ? botList.value.results.map((bot) => ({
          url: `${BASE_URL}/bots/${bot.vanity ?? bot.bot_id}`,
          changeFrequency: "daily" as const,
          priority: 0.8,
        }))
      : [];

  const serverUrls: MetadataRoute.Sitemap =
    serverList.status === "fulfilled"
      ? serverList.value.results.map((server) => ({
          url: `${BASE_URL}/servers/${server.vanity ?? server.server_id}`,
          changeFrequency: "daily" as const,
          priority: 0.7,
        }))
      : [];

  return [...staticRoutes, ...botUrls, ...serverUrls];
}

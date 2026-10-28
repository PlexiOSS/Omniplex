import type { MetadataRoute } from "next";
import { blogs, bots, list, packs, servers } from "@/lib/api";
import { BASE_URL } from "@/lib/api/config";
import type { PagedResult } from "@/lib/api/types";
import { getKbCategories } from "@/lib/kb/content";
import { getLegalDocuments } from "@/lib/legal/content";

export const revalidate = 3600;

const MAX_PAGES = 50;

type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

function page(path: string, changeFrequency: Freq, priority: number) {
  return { url: `${BASE_URL}${path}`, changeFrequency, priority };
}

async function collect<T>(
  fetchPage: (page: number) => Promise<PagedResult<T[]>>,
): Promise<T[]> {
  const items: T[] = [];
  for (let p = 1; p <= MAX_PAGES; p++) {
    const res = await fetchPage(p).catch(() => null);
    if (!res || res.results.length === 0) break;
    items.push(...res.results);
    if (items.length >= res.count || res.results.length < res.per_page) break;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    page("", "daily", 1),
    page("/bots", "hourly", 0.9),
    page("/servers", "hourly", 0.9),
    page("/packs", "daily", 0.8),
    page("/tags", "weekly", 0.7),
    page("/commands", "daily", 0.7),
    page("/collections", "daily", 0.7),
    page("/emojis", "daily", 0.6),
    page("/stickers", "daily", 0.6),
    page("/sounds", "daily", 0.6),
    page("/templates", "daily", 0.6),
    page("/themes", "daily", 0.6),
    page("/leaderboard", "daily", 0.6),
    page("/badges", "weekly", 0.5),
    page("/alternatives", "monthly", 0.6),
    page("/feed", "hourly", 0.5),
    page("/search", "weekly", 0.5),
    page("/kb", "weekly", 0.6),
    page("/blog", "weekly", 0.6),
    page("/changelog", "weekly", 0.5),
    page("/about", "monthly", 0.5),
    page("/about/stats", "daily", 0.4),
    page("/about/team", "monthly", 0.4),
    page("/about/moderation", "weekly", 0.4),
    page("/partners", "weekly", 0.4),
    page("/premium", "monthly", 0.4),
    page("/shop", "monthly", 0.4),
    page("/apps", "monthly", 0.3),
    page("/legal", "monthly", 0.3),
    ...getLegalDocuments().map((doc) =>
      page(`/legal/${doc.slug}`, "monthly", 0.3),
    ),
  ];

  const kbRoutes = getKbCategories().flatMap((category) => [
    page(`/kb/${category.slug}`, "weekly", 0.5),
    ...category.articles.map((article) =>
      page(`/kb/${category.slug}/${article.slug}`, "monthly", 0.5),
    ),
  ]);

  const [botList, serverList, packList, blogList, tagList] = await Promise.all([
    collect((p) => bots.getAll(p)),
    collect((p) => servers.getAll(p)),
    collect((p) => packs.getAll(p, undefined, { all: true })),
    blogs.getAll().catch(() => null),
    list.getTags().catch(() => null),
  ]);

  return [
    ...staticRoutes,
    ...kbRoutes,
    ...botList.map((bot) =>
      page(`/bots/${bot.vanity || bot.bot_id}`, "daily", 0.8),
    ),
    ...serverList.map((server) =>
      page(`/servers/${server.vanity || server.server_id}`, "daily", 0.7),
    ),
    ...packList
      .filter((pack) => pack.url)
      .map((pack) => page(`/packs/${pack.url}`, "weekly", 0.6)),
    ...(blogList?.posts ?? [])
      .filter((post) => !post.draft)
      .map((post) => page(`/blog/${post.slug}`, "monthly", 0.5)),
    ...(tagList?.tags ?? []).map((t) =>
      page(`/tags/${encodeURIComponent(t.tag)}`, "weekly", 0.5),
    ),
  ];
}

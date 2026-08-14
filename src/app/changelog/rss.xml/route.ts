import { BASE_URL } from "@/lib/api/config";
import { getChangelogEntries } from "@/lib/github/releases";

// Matches the releases fetch's own cache window (lib/github/releases.ts) —
// no point revalidating this more often than the data underneath it does.
export const revalidate = 900;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const entries = await getChangelogEntries();

  const items = entries
    .map((entry) => {
      const title = escapeXml(
        `${entry.source.label}: ${entry.name || entry.tag_name}`,
      );
      const pubDate = entry.published_at
        ? new Date(entry.published_at).toUTCString()
        : new Date().toUTCString();

      return `
    <item>
      <title>${title}</title>
      <link>${escapeXml(entry.html_url)}</link>
      <guid isPermaLink="true">${escapeXml(entry.html_url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(entry.body ?? "")}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Omniplex Changelog</title>
    <link>${BASE_URL}/changelog</link>
    <description>Release notes for Popplio and Omniplex, pulled from GitHub.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

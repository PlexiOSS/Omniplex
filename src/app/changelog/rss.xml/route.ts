import { changelogs } from "@/lib/api";
import { BASE_URL } from "@/lib/api/config";

const PROJECT_LABEL: Record<string, string> = {
  popplio: "Popplio",
  omniplex: "Omniplex",
  keel: "Keel",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { entries } = await changelogs.getAll();

  const items = entries
    .map((entry) => {
      const title = escapeXml(
        `${PROJECT_LABEL[entry.project] ?? entry.project}: ${entry.version}`,
      );
      const link = `${BASE_URL}/changelog`;
      const pubDate = new Date(entry.created_at).toUTCString();

      const description = [
        entry.extra_description,
        entry.added.length ? `Added: ${entry.added.join("; ")}` : "",
        entry.updated.length ? `Updated: ${entry.updated.join("; ")}` : "",
        entry.fixed.length ? `Fixed: ${entry.fixed.join("; ")}` : "",
        entry.removed.length ? `Removed: ${entry.removed.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join(" — ");

      return `
    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(entry.itag)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Omniplex Changelog</title>
    <link>${BASE_URL}/changelog</link>
    <description>Curated release notes for Popplio, Omniplex, and Keel.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

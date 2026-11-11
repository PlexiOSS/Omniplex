import {
  bots as botsApi,
  search,
  servers as serversApi,
} from "@omniplex/core/api";
import { BASE_URL } from "@omniplex/core/api/config";
import { botPath, serverPath } from "@omniplex/core/utils/assets";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { ArrowRight, Tag as TagIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BotCard } from "@/components/cards/BotCard";
import { PackCard } from "@/components/cards/PackCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { JsonLd } from "@/components/seo/JsonLd";
import { isApiUnavailable } from "@/lib/utils/errors";

const RELATED_LIMIT = 10;

function relatedTags(current: string, tagLists: string[][]): string[] {
  const counts = new Map<string, { label: string; n: number }>();
  const self = current.toLowerCase();
  for (const tags of tagLists) {
    for (const tag of new Set(tags.map((t) => t.trim()).filter(Boolean))) {
      const key = tag.toLowerCase();
      if (key === self) continue;
      const entry = counts.get(key);
      if (entry) entry.n += 1;
      else counts.set(key, { label: tag, n: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, RELATED_LIMIT)
    .map((e) => e.label);
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      {label} <ArrowRight size={14} />
    </Link>
  );
}

interface Props {
  params: Promise<{ tag: string }>;
}

function displayTag(tag: string): string {
  return tag.replace(
    /(^|[\s-])([a-z])/g,
    (_, sep, ch) => sep + ch.toUpperCase(),
  );
}

function tagHeading(tag: string, bots: number, servers: number): string {
  const name = displayTag(tag);
  if (bots > 0 && servers === 0) return `Best ${name} Discord Bots`;
  if (servers > 0 && bots === 0) return `Best ${name} Discord Servers`;
  return `${name} Discord Bots and Servers`;
}

function tagIntro(tag: string, bots: number, servers: number): string {
  const name = displayTag(tag).toLowerCase();
  const parts = [
    bots > 0 && `${bots === 1 ? "1 bot" : `${bots} bots`}`,
    servers > 0 && `${servers === 1 ? "1 server" : `${servers} servers`}`,
  ].filter(Boolean);
  const what = parts.join(" and ") || "listings";
  return `Looking for ${name} for your Discord? Omniplex has ${what} tagged ${name}, ranked by community votes. Open any of them to read reviews, see commands and stats, and add it in one click.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const [botPage, serverPage] = await Promise.all([
    botsApi.getAll(1, { tag: decoded, sort: "votes" }).catch(() => null),
    serversApi.getAll(1, { tag: decoded, sort: "votes" }).catch(() => null),
  ]);
  const bots = botPage?.count ?? 0;
  const servers = serverPage?.count ?? 0;
  return {
    title: tagHeading(decoded, bots, servers),
    description: tagIntro(decoded, bots, servers),
    alternates: {
      canonical: `/tags/${encodeURIComponent(decoded.toLowerCase())}`,
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  let results: Awaited<ReturnType<typeof search.search>>;
  let botPage: Awaited<ReturnType<typeof botsApi.getAll>>;
  let serverPage: Awaited<ReturnType<typeof serversApi.getAll>>;
  try {
    [results, botPage, serverPage] = await Promise.all([
      search.search({
        target_types: ["team", "pack"],
        tags: { tags: [decoded], tag_mode: "&&" },
      }),
      botsApi.getAll(1, { tag: decoded, sort: "votes" }),
      serversApi.getAll(1, { tag: decoded, sort: "votes" }),
    ]);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
    throw err;
  }

  const bots = botPage.results;
  const servers = serverPage.results;
  const teams = results.teams ?? [];
  const packs = results.packs ?? [];
  const total = botPage.count + serverPage.count + teams.length + packs.length;
  const related = relatedTags(decoded, [
    ...bots.map((b) => b.tags ?? []),
    ...servers.map((sv) => sv.tags ?? []),
  ]);
  const tagParam = encodeURIComponent(decoded);

  return (
    <Container className="py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: tagHeading(decoded, botPage.count, serverPage.count),
          itemListElement: [
            ...bots.map((b) => botPath(b.bot_id, b.vanity)),
            ...servers.map((s) => serverPath(s.server_id, s.vanity)),
          ]
            .slice(0, 20)
            .map((path, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${BASE_URL}${path}`,
            })),
        }}
      />
      <div className="mb-8">
        <PageHeader
          icon={TagIcon}
          title={tagHeading(decoded, botPage.count, serverPage.count)}
          description={
            <>
              {[
                botPage.count > 0 && formatCountLabel(botPage.count, "bot"),
                serverPage.count > 0 &&
                  formatCountLabel(serverPage.count, "server"),
                teams.length > 0 && formatCountLabel(teams.length, "team"),
                packs.length > 0 && formatCountLabel(packs.length, "pack"),
              ]
                .filter(Boolean)
                .join(", ") || "No results"}{" "}
              tagged &quot;{decoded}&quot;, most voted first.
            </>
          }
          actions={
            <Link
              href="/tags"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              All tags
            </Link>
          }
        />
        {related.length > 0 && (
          <div className="-mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Related:
            </span>
            {related.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Nothing tagged &quot;{decoded}&quot; yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {bots.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Bots
                </h2>
                {botPage.count > bots.length && (
                  <SeeAll
                    href={`/bots?tag=${tagParam}&sort=votes`}
                    label={`See all ${formatCountLabel(botPage.count, "bot")}`}
                  />
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                  <BotCard key={bot.bot_id} bot={bot} />
                ))}
              </div>
            </section>
          )}

          {servers.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Servers
                </h2>
                {serverPage.count > servers.length && (
                  <SeeAll
                    href={`/servers?tag=${tagParam}&sort=votes`}
                    label={`See all ${formatCountLabel(serverPage.count, "server")}`}
                  />
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {servers.map((server) => (
                  <ServerCard key={server.server_id} server={server} />
                ))}
              </div>
            </section>
          )}

          {teams.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Teams
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            </section>
          )}

          {packs.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Packs
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack) => (
                  <PackCard key={pack.url} pack={pack} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Container>
  );
}

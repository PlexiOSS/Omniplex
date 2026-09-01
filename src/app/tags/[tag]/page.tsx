import { Tag as TagIcon } from "lucide-react";
import type { Metadata } from "next";
import { BotCard } from "@/components/cards/BotCard";
import { PackCard } from "@/components/cards/PackCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { search } from "@/lib/api";
import { isApiUnavailable } from "@/lib/utils/errors";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: decoded,
    description: `Bots, servers, teams, and packs tagged "${decoded}" on Omniplex.`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  let results = null;
  try {
    results = await search.search({
      target_types: ["bot", "server", "team", "pack"],
      tags: { tags: [decoded], tag_mode: "&&" },
    });
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
  }

  const bots = results?.bots ?? [];
  const servers = results?.servers ?? [];
  const teams = results?.teams ?? [];
  const packs = results?.packs ?? [];
  const total = bots.length + servers.length + teams.length + packs.length;

  return (
    <Container className="py-10">
      <div className="mb-8">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
          <TagIcon size={12} />
          Tag
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {decoded}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {total} result{total === 1 ? "" : "s"} tagged &quot;{decoded}&quot;,
          most voted first.
        </p>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Nothing tagged &quot;{decoded}&quot; yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {bots.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Bots
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                  <BotCard key={bot.bot_id} bot={bot} />
                ))}
              </div>
            </section>
          )}

          {servers.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Servers
              </h2>
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

import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { search } from "@/lib/api";
import type { IndexBot, IndexServer } from "@/lib/api/types";
import { COLLECTIONS, type Collection } from "@/lib/constants/collections";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Curated, auto-ranked collections of the best bots and servers on Omniplex, grouped by tag.",
};

const PREVIEW_COUNT = 6;

interface CollectionPreview {
  collection: Collection;
  bots: IndexBot[];
  servers: IndexServer[];
}

async function fetchPreview(
  collection: Collection,
): Promise<CollectionPreview> {
  try {
    const results = await search.search({
      target_types: [collection.targetType],
      tags: { tags: [collection.tag], tag_mode: "&&" },
    });
    return {
      collection,
      bots: (results.bots ?? []).slice(0, PREVIEW_COUNT),
      servers: (results.servers ?? []).slice(0, PREVIEW_COUNT),
    };
  } catch {
    return { collection, bots: [], servers: [] };
  }
}

export default async function CollectionsPage() {
  let previews: CollectionPreview[];
  try {
    previews = await Promise.all(COLLECTIONS.map(fetchPreview));
  } catch {
    return <ServiceUnavailable />;
  }

  return (
    <Container className="py-10">
      <div className="mb-10 flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Collections
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Curated by tag, ranked automatically by votes nothing here is
            hand-ordered.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {previews.map(({ collection, bots, servers }) => {
          const items = collection.targetType === "bot" ? bots : servers;
          if (items.length === 0) return null;

          return (
            <section key={collection.slug}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {collection.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {collection.description}
                  </p>
                </div>
                <Link
                  href={`/tags/${encodeURIComponent(collection.tag)}`}
                  className="flex shrink-0 items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collection.targetType === "bot"
                  ? bots.map((bot) => <BotCard key={bot.bot_id} bot={bot} />)
                  : servers.map((server) => (
                      <ServerCard key={server.server_id} server={server} />
                    ))}
              </div>
            </section>
          );
        })}

        {previews.every(
          ({ collection, bots, servers }) =>
            (collection.targetType === "bot" ? bots : servers).length === 0,
        ) && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
            <p className="text-sm">Nothing to show yet.</p>
          </div>
        )}
      </div>
    </Container>
  );
}

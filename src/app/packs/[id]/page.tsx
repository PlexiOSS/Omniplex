import { ArrowLeft, Bot, Server, Smile, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { PackTypeBadge } from "@/components/packs/PackTypeBadge";
import { ReportModal } from "@/components/reports/ReportModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { WidgetShare } from "@/components/widget/WidgetShare";
import { packs } from "@/lib/api";
import { packEmojiUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { PACK_WIDGET_STATS } from "@/lib/widget/shared";
import { PackVoteButton } from "./PackVoteButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seo = await packs.getSeo(id).catch(() => null);
  if (!seo) return {};
  return {
    title: seo.name,
    description: seo.short,
  };
}

export default async function PackPage({ params }: Props) {
  const { id } = await params;
  let pack = null;
  try {
    pack = await packs.getPack(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    notFound();
  }
  if (!pack) notFound();

  return (
    <Container className="py-10">
      <Link
        href="/packs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All Packs
      </Link>

      {/* Pack header */}
      <div className="flex items-start gap-5">
        {/* Stacked avatars — bots/servers get their own avatar, emoji packs
            preview the first few emojis instead */}
        <div className="flex shrink-0 -space-x-3">
          {pack.pack_type === "bot" &&
            (pack.bots ?? [])
              .slice(0, 4)
              .map((bot) => (
                <Avatar
                  key={bot.bot_id}
                  src={bot.user.avatar}
                  alt={bot.user.username}
                  size={52}
                  className="ring-2 ring-white dark:ring-zinc-950"
                />
              ))}
          {pack.pack_type === "server" &&
            (pack.servers ?? [])
              .slice(0, 4)
              .map((server) => (
                <Avatar
                  key={server.server_id}
                  src={
                    server.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`
                  }
                  alt={server.name}
                  size={52}
                  className="ring-2 ring-white dark:ring-zinc-950"
                />
              ))}
          {pack.pack_type === "emoji" &&
            (pack.emojis ?? []).slice(0, 4).map((emoji) => (
              <div
                key={emoji.id}
                className="flex h-13 w-13 items-center justify-center rounded-full bg-zinc-100 ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-950"
              >
                {/* biome-ignore lint/performance/noImgElement: small pack emoji preview */}
                <img
                  src={packEmojiUrl(pack.url, emoji.id, emoji.animated)}
                  alt={emoji.name}
                  width={32}
                  height={32}
                />
              </div>
            ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {pack.name}
            </h1>
            <PackTypeBadge type={pack.pack_type} />
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {pack.short}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Star size={13} />
              {formatCount(pack.votes)} votes
            </span>
            {pack.pack_type === "bot" && (
              <span className="flex items-center gap-1">
                <Bot size={13} />
                {(pack.bot_ids ?? []).length} bots
              </span>
            )}
            {pack.pack_type === "server" && (
              <span className="flex items-center gap-1">
                <Server size={13} />
                {(pack.server_ids ?? []).length} servers
              </span>
            )}
            {pack.pack_type === "emoji" && (
              <span className="flex items-center gap-1">
                <Smile size={13} />
                {(pack.emojis ?? []).length} emojis
              </span>
            )}
            <span>by {pack.owner.display_name || pack.owner.username}</span>
            <span>{formatRelativeTime(pack.created_at)}</span>
          </div>

          {(pack.tags ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(pack.tags ?? []).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4">
            <ReportModal
              targetType="pack"
              targetId={pack.url}
              targetLabel="pack"
            />
          </div>

          <div className="mt-4 max-w-xs">
            <PackVoteButton
              packUrl={pack.url}
              currentVotes={pack.votes}
              voteBanned={pack.vote_banned}
            />
          </div>
        </div>
      </div>

      <section className="mt-10 max-w-md">
        <WidgetShare
          widgetPath={`/packs/${pack.url}/widget`}
          stats={PACK_WIDGET_STATS}
        />
      </section>

      {/* Bots in this pack */}
      {(pack.bots ?? []).length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Bots in this pack
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(pack.bots ?? []).map((bot) => (
              <BotCard key={bot.bot_id} bot={bot} />
            ))}
          </div>
        </section>
      )}

      {/* Servers in this pack */}
      {(pack.servers ?? []).length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Servers in this pack
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(pack.servers ?? []).map((server) => (
              <ServerCard key={server.server_id} server={server} />
            ))}
          </div>
        </section>
      )}

      {/* Emojis in this pack */}
      {(pack.emojis ?? []).length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Emojis in this pack
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-3">
            {(pack.emojis ?? []).map((emoji) => (
              <div
                key={emoji.id}
                title={`:${emoji.name}:`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* biome-ignore lint/performance/noImgElement: pack emoji grid item */}
                <img
                  src={packEmojiUrl(pack.url, emoji.id, emoji.animated)}
                  alt={emoji.name}
                  width={32}
                  height={32}
                />
                <span className="w-full truncate text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  {emoji.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

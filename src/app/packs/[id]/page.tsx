import { ArrowLeft, Bot, Server, Smile, Star, Sticker } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { DownloadPackButton } from "@/components/packs/DownloadPackButton";
import { PackTypeBadge } from "@/components/packs/PackTypeBadge";
import { ReportModal } from "@/components/reports/ReportModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { WidgetShare } from "@/components/widget/WidgetShare";
import { packs } from "@/lib/api";
import { packEmojiUrl, packStickerUrl } from "@/lib/utils/assets";
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

  const itemCount =
    pack.pack_type === "bot"
      ? (pack.bot_ids ?? []).length
      : pack.pack_type === "server"
        ? (pack.server_ids ?? []).length
        : pack.pack_type === "sticker"
          ? (pack.stickers ?? []).length
          : (pack.emojis ?? []).length;

  const itemIcon =
    pack.pack_type === "bot" ? (
      <Bot size={14} />
    ) : pack.pack_type === "server" ? (
      <Server size={14} />
    ) : pack.pack_type === "sticker" ? (
      <Sticker size={14} />
    ) : (
      <Smile size={14} />
    );

  const itemLabel =
    pack.pack_type === "bot"
      ? "Bots"
      : pack.pack_type === "server"
        ? "Servers"
        : pack.pack_type === "sticker"
          ? "Stickers"
          : "Emojis";

  const actionsCard = (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <PackVoteButton
        packUrl={pack.url}
        currentVotes={pack.votes}
        voteBanned={pack.vote_banned}
      />
      {pack.pack_type === "emoji" && (
        <DownloadPackButton
          kind="emoji"
          packUrl={pack.url}
          packName={pack.name}
          emojis={pack.emojis ?? []}
        />
      )}
      {pack.pack_type === "sticker" && (
        <DownloadPackButton
          kind="sticker"
          packUrl={pack.url}
          packName={pack.name}
          stickers={pack.stickers ?? []}
        />
      )}
    </div>
  );

  return (
    <Container className="py-10">
      <Link
        href="/packs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All Packs
      </Link>

      <Banner
        src={null}
        alt={pack.name}
        className="mb-6 -mt-2 h-40 rounded-2xl sm:h-52"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex shrink-0 -space-x-3">
              {pack.pack_type === "bot" &&
                (pack.bots ?? [])
                  .slice(0, 4)
                  .map((bot) => (
                    <Avatar
                      key={bot.bot_id}
                      src={bot.user.avatar}
                      alt={bot.user.username}
                      size={64}
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
                      size={64}
                      className="ring-2 ring-white dark:ring-zinc-950"
                    />
                  ))}
              {pack.pack_type === "emoji" &&
                (pack.emojis ?? []).slice(0, 4).map((emoji) => (
                  <div
                    key={emoji.id}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-950"
                  >
                    {/* biome-ignore lint/performance/noImgElement: small pack emoji preview */}
                    <img
                      src={packEmojiUrl(pack.url, emoji.id, emoji.animated)}
                      alt={emoji.name}
                      width={36}
                      height={36}
                    />
                  </div>
                ))}
              {pack.pack_type === "sticker" &&
                (pack.stickers ?? []).slice(0, 4).map((sticker) => (
                  <div
                    key={sticker.id}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-950"
                  >
                    {/* biome-ignore lint/performance/noImgElement: small pack sticker preview */}
                    <img
                      src={packStickerUrl(
                        pack.url,
                        sticker.id,
                        sticker.animated,
                      )}
                      alt={sticker.name}
                      width={36}
                      height={36}
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
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {pack.short}
              </p>
            </div>
          </div>

          {(pack.tags ?? []).length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(pack.tags ?? []).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          {/* Actions (mobile only — desktop version lives in the sidebar) */}
          <div className="mt-5 lg:hidden">{actionsCard}</div>

          <div className="mt-3 flex items-center gap-4">
            <ReportModal
              targetType="pack"
              targetId={pack.url}
              targetLabel="pack"
            />
          </div>

          {/* Bots in this pack */}
          {(pack.bots ?? []).length > 0 && (
            <section className="mt-10">
              <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Bots in this pack
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(pack.bots ?? []).map((bot) => (
                  <BotCard key={bot.bot_id} bot={bot} />
                ))}
              </div>
            </section>
          )}

          {/* Servers in this pack */}
          {(pack.servers ?? []).length > 0 && (
            <section className="mt-10">
              <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Servers in this pack
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(pack.servers ?? []).map((server) => (
                  <ServerCard key={server.server_id} server={server} />
                ))}
              </div>
            </section>
          )}

          {/* Emojis in this pack */}
          {(pack.emojis ?? []).length > 0 && (
            <section className="mt-10">
              <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Emojis in this pack
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
                {(pack.emojis ?? []).map((emoji) => (
                  <Link
                    key={emoji.id}
                    href={`/emojis/${emoji.id}`}
                    title={`:${emoji.name}:`}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
                  >
                    {/* biome-ignore lint/performance/noImgElement: pack emoji grid item */}
                    <img
                      src={packEmojiUrl(pack.url, emoji.id, emoji.animated)}
                      alt={emoji.name}
                      width={36}
                      height={36}
                    />
                    <span className="w-full truncate text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                      {emoji.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Stickers in this pack */}
          {(pack.stickers ?? []).length > 0 && (
            <section className="mt-10">
              <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Stickers in this pack
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
                {(pack.stickers ?? []).map((sticker) => (
                  <Link
                    key={sticker.id}
                    href={`/stickers/${sticker.id}`}
                    title={sticker.name}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
                  >
                    {/* biome-ignore lint/performance/noImgElement: pack sticker grid item */}
                    <img
                      src={packStickerUrl(
                        pack.url,
                        sticker.id,
                        sticker.animated,
                      )}
                      alt={sticker.name}
                      width={36}
                      height={36}
                    />
                    <span className="w-full truncate text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                      {sticker.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions (desktop only — mobile version renders above the pack contents) */}
          <div className="hidden lg:block">{actionsCard}</div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <StatRow
                icon={<Star size={14} />}
                label="Votes"
                value={formatCount(pack.votes)}
              />
              <StatRow
                icon={itemIcon}
                label={itemLabel}
                value={String(itemCount)}
              />
              <StatRow
                icon={null}
                label="Created"
                value={formatRelativeTime(pack.created_at)}
              />
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Owner
            </h3>
            <Link
              href={`/user/${pack.owner.id}`}
              className="flex items-center gap-2.5"
            >
              <Avatar
                src={pack.owner.avatar}
                alt={pack.owner.username}
                size={32}
              />
              <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                {pack.owner.display_name || pack.owner.username}
              </span>
            </Link>
          </div>

          <WidgetShare
            widgetPath={`/packs/${pack.url}/widget`}
            stats={PACK_WIDGET_STATS}
          />
        </aside>
      </div>
    </Container>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </span>
      <span className="font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}

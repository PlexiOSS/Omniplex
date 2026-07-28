import { ArrowLeft, Bot, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotCard } from "@/components/cards/BotCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { WidgetShare } from "@/components/widget/WidgetShare";
import { packs } from "@/lib/api";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { PACK_WIDGET_STATS } from "@/lib/widget/shared";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pack = await packs.getPack(id).catch(() => null);
  if (!pack) return {};
  return {
    title: pack.name,
    description: pack.short,
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
        {/* Stacked bot avatars */}
        <div className="flex shrink-0 -space-x-3">
          {(pack.bots ?? []).slice(0, 4).map((bot) => (
            <Avatar
              key={bot.bot_id}
              src={bot.user.avatar}
              alt={bot.user.username}
              size={52}
              className="ring-2 ring-white dark:ring-zinc-950"
            />
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {pack.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {pack.short}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Star size={13} />
              {formatCount(pack.votes)} votes
            </span>
            <span className="flex items-center gap-1">
              <Bot size={13} />
              {(pack.bot_ids ?? []).length} bots
            </span>
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
    </Container>
  );
}

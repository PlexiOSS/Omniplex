import { Eye, MousePointerClick, Server, Star } from "lucide-react";
import type { Metadata } from "next";
import { CompareSlot } from "@/components/compare/CompareSlot";
import type { CompareEntity } from "@/components/compare/types";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { bots, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Bot } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export const metadata: Metadata = {
  title: "Compare Bots",
  description:
    "Compare two Discord bots side by side — votes, servers, and tags.",
};

async function fetchBotSafe(id: string | undefined): Promise<Bot | null> {
  if (!id) return null;
  try {
    return await bots.getBot(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(() => null);
      if (resolved?.target_type === "bot") {
        return bots.getBot(resolved.target_id).catch(() => null);
      }
      return null;
    }
    throw err;
  }
}

function toCompareEntity(bot: Bot): CompareEntity {
  return {
    id: bot.bot_id,
    href: `/bots/${bot.vanity || bot.bot_id}`,
    name: bot.user.username,
    avatarSrc: mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar),
    short: bot.short,
    tags: bot.tags,
    stats: [
      {
        icon: <Star size={14} />,
        label: "Votes",
        value: formatCount(bot.approximate_votes),
      },
      {
        icon: <Server size={14} />,
        label: "Servers",
        value: formatCount(bot.servers),
      },
      {
        icon: <Eye size={14} />,
        label: "Page Views",
        value: formatCount(bot.clicks),
      },
      {
        icon: <MousePointerClick size={14} />,
        label: "Invite Clicks",
        value: formatCount(bot.invite_clicks),
      },
    ],
  };
}

export default async function CompareBotsPage({ searchParams }: Props) {
  const { a, b } = await searchParams;

  let botA: Bot | null = null;
  let botB: Bot | null = null;
  try {
    [botA, botB] = await Promise.all([fetchBotSafe(a), fetchBotSafe(b)]);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
  }

  const entityA = botA ? toCompareEntity(botA) : null;
  const entityB = botB ? toCompareEntity(botB) : null;
  const sharedTags = new Set(
    entityA && entityB
      ? entityA.tags.filter((tag) => entityB.tags.includes(tag))
      : [],
  );

  return (
    <Container className="py-10" narrow>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Compare Bots
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick two bots to compare side by side.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <CompareSlot
          key={entityA?.id ?? "a-empty"}
          targetType="bot"
          paramName="a"
          entity={entityA}
          sharedTags={sharedTags}
        />
        <CompareSlot
          key={entityB?.id ?? "b-empty"}
          targetType="bot"
          paramName="b"
          entity={entityB}
          sharedTags={sharedTags}
        />
      </div>
    </Container>
  );
}

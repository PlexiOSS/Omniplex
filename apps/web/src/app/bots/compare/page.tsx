import { bots, vanity } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { Bot } from "@omniplex/core/api/types";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { formatCount } from "@omniplex/core/utils/format";
import {
  ArrowRightLeft,
  Eye,
  MousePointerClick,
  Server,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import { CompareSlot } from "@/components/compare/CompareSlot";
import type { CompareEntity } from "@/components/compare/types";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { isApiUnavailable } from "@/lib/utils/errors";
import { statHidden } from "@/lib/utils/hiddenStats";

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export const metadata: Metadata = {
  alternates: { canonical: "/bots/compare" },
  title: "Compare Bots",
  description:
    "Compare two Discord bots side by side: votes, servers, and tags.",
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
        value: statHidden(bot, "servers") ? "Hidden" : formatCount(bot.servers),
      },
      {
        icon: <Eye size={14} />,
        label: "Views (30 days)",
        value: statHidden(bot, "views")
          ? "Hidden"
          : formatCount(bot.views_30d ?? 0),
      },
      {
        icon: <MousePointerClick size={14} />,
        label: "Invite Clicks",
        value: statHidden(bot, "invites")
          ? "Hidden"
          : formatCount(bot.invite_clicks),
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
    <Container className="py-10">
      <PageHeader
        icon={ArrowRightLeft}
        title="Compare Bots"
        description={<>Pick two bots to compare side by side.</>}
      />

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

import { Eye, MousePointerClick, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import { CompareSlot } from "@/components/compare/CompareSlot";
import type { CompareEntity } from "@/components/compare/types";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { servers, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Server } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export const metadata: Metadata = {
  title: "Compare Servers",
  description:
    "Compare two Discord servers side by side — votes, members, and tags.",
};

async function fetchServerSafe(id: string | undefined): Promise<Server | null> {
  if (!id) return null;
  try {
    return await servers.getServer(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(() => null);
      if (resolved?.target_type === "server") {
        return servers.getServer(resolved.target_id).catch(() => null);
      }
      return null;
    }
    throw err;
  }
}

function toCompareEntity(server: Server): CompareEntity {
  return {
    id: server.server_id,
    href: `/servers/${server.vanity || server.server_id}`,
    name: server.name,
    avatarSrc: mirroredAvatarUrl(
      "servers",
      server.server_id,
      server.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=256&background=random`,
    ),
    short: server.short,
    tags: server.tags,
    stats: [
      {
        icon: <Star size={14} />,
        label: "Votes",
        value: formatCount(server.approximate_votes),
      },
      {
        icon: <Users size={14} />,
        label: "Members",
        value: formatCount(server.total_members),
      },
      {
        icon: <Eye size={14} />,
        label: "Page Views",
        value: formatCount(server.clicks),
      },
      {
        icon: <MousePointerClick size={14} />,
        label: "Invite Clicks",
        value: formatCount(server.invite_clicks),
      },
    ],
  };
}

export default async function CompareServersPage({ searchParams }: Props) {
  const { a, b } = await searchParams;

  let serverA: Server | null = null;
  let serverB: Server | null = null;
  try {
    [serverA, serverB] = await Promise.all([
      fetchServerSafe(a),
      fetchServerSafe(b),
    ]);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
  }

  const entityA = serverA ? toCompareEntity(serverA) : null;
  const entityB = serverB ? toCompareEntity(serverB) : null;
  const sharedTags = new Set(
    entityA && entityB
      ? entityA.tags.filter((tag) => entityB.tags.includes(tag))
      : [],
  );

  return (
    <Container className="py-10" narrow>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Compare Servers
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick two servers to compare side by side.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <CompareSlot
          key={entityA?.id ?? "a-empty"}
          targetType="server"
          paramName="a"
          entity={entityA}
          sharedTags={sharedTags}
        />
        <CompareSlot
          key={entityB?.id ?? "b-empty"}
          targetType="server"
          paramName="b"
          entity={entityB}
          sharedTags={sharedTags}
        />
      </div>
    </Container>
  );
}

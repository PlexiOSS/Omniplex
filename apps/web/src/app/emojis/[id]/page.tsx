import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { AssetDownloadButton } from "@/components/packs/AssetDownloadButton";
import { AssetHero } from "@/components/packs/AssetHero";
import { DiscordPreview } from "@/components/packs/DiscordPreview";
import { SimilarPackAssets } from "@/components/packs/SimilarPackAssets";
import { Badge } from "@/components/ui/Badge";
import { emojis, packs, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { packEmojiUrl } from "@/lib/utils/assets";
import {
  isApiUnavailable,
  isNotFoundError,
  nullIfNotFound,
} from "@/lib/utils/errors";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchEmoji(id: string) {
  try {
    return await emojis.getById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(nullIfNotFound);
      if (resolved?.target_type === "pack_emoji") {
        return emojis.getById(resolved.target_id);
      }
    }
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const emoji = await fetchEmoji(id).catch(() => null);
  if (!emoji) return {};
  return {
    title: `:${emoji.name}:`,
    description: `An emoji from the "${emoji.pack_name}" pack on Omniplex.`,
  };
}

export default async function EmojiPage({ params }: Props) {
  const { id } = await params;
  let emoji = null;
  try {
    emoji = await fetchEmoji(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!emoji) notFound();

  const assetUrl = packEmojiUrl(emoji.pack_url, emoji.id, emoji.animated);
  const ext = emoji.animated ? "gif" : "webp";

  const pack = await packs.getPack(emoji.pack_url).catch(() => null);
  const similar = (pack?.emojis ?? [])
    .filter((e) => e.id !== emoji.id)
    .slice(0, 6);

  return (
    <Container className="py-10">
      <AssetHero
        backHref="/emojis"
        backLabel="All Emojis"
        preview={
          // biome-ignore lint/performance/noImgElement: full-size emoji preview
          <img
            src={assetUrl}
            alt={emoji.name}
            width={128}
            height={128}
            className="h-32 w-32 object-contain"
          />
        }
        title={`:${emoji.name}:`}
        badges={
          emoji.animated ? (
            <Badge variant="info">
              <Sparkles size={11} />
              Animated
            </Badge>
          ) : undefined
        }
        packUrl={emoji.pack_url}
        packName={emoji.pack_name}
        owner={emoji.owner}
        stats={[
          { label: "Downloads", value: formatCount(emoji.downloads) },
          { label: "Type", value: emoji.animated ? "Animated GIF" : "WebP" },
          { label: "Uploaded", value: formatRelativeTime(emoji.created_at) },
        ]}
        download={
          <AssetDownloadButton
            kind="emoji"
            id={emoji.id}
            assetUrl={assetUrl}
            fileName={`${emoji.name}.${ext}`}
            initialDownloads={emoji.downloads}
          />
        }
        vanity={emoji.vanity}
        basePath="/emojis"
      />

      <DiscordPreview kind="emoji" src={assetUrl} name={emoji.name} />
      <SimilarPackAssets
        kind="emoji"
        packUrl={emoji.pack_url}
        packName={emoji.pack_name}
        items={similar}
      />
    </Container>
  );
}

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
import { packs, stickers, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { packStickerUrl } from "@/lib/utils/assets";
import {
  isApiUnavailable,
  isNotFoundError,
  nullIfNotFound,
} from "@/lib/utils/errors";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchSticker(id: string) {
  try {
    return await stickers.getById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(nullIfNotFound);
      if (resolved?.target_type === "pack_sticker") {
        return stickers.getById(resolved.target_id);
      }
    }
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sticker = await fetchSticker(id).catch(() => null);
  if (!sticker) return {};
  return {
    title: sticker.name,
    description: `A sticker from the "${sticker.pack_name}" pack on Omniplex.`,
  };
}

export default async function StickerPage({ params }: Props) {
  const { id } = await params;
  let sticker = null;
  try {
    sticker = await fetchSticker(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!sticker) notFound();

  const assetUrl = packStickerUrl(
    sticker.pack_url,
    sticker.id,
    sticker.animated,
  );
  const ext = sticker.animated ? "gif" : "webp";

  const pack = await packs.getPack(sticker.pack_url).catch(() => null);
  const similar = (pack?.stickers ?? [])
    .filter((s) => s.id !== sticker.id)
    .slice(0, 6);

  return (
    <Container className="py-10">
      <AssetHero
        backHref="/stickers"
        backLabel="All Stickers"
        preview={
          // biome-ignore lint/performance/noImgElement: full-size sticker preview
          <img
            src={assetUrl}
            alt={sticker.name}
            width={220}
            height={220}
            className="h-56 w-56 object-contain"
          />
        }
        title={sticker.name}
        badges={
          sticker.animated ? (
            <Badge variant="info">
              <Sparkles size={11} />
              Animated
            </Badge>
          ) : undefined
        }
        packUrl={sticker.pack_url}
        packName={sticker.pack_name}
        owner={sticker.owner}
        stats={[
          { label: "Downloads", value: formatCount(sticker.downloads) },
          { label: "Type", value: sticker.animated ? "Animated" : "Static" },
          { label: "Uploaded", value: formatRelativeTime(sticker.created_at) },
        ]}
        download={
          <AssetDownloadButton
            kind="sticker"
            id={sticker.id}
            assetUrl={assetUrl}
            fileName={`${sticker.name}.${ext}`}
            initialDownloads={sticker.downloads}
          />
        }
        vanity={sticker.vanity}
        basePath="/stickers"
      />

      <DiscordPreview kind="sticker" src={assetUrl} name={sticker.name} />
      <SimilarPackAssets
        kind="sticker"
        packUrl={sticker.pack_url}
        packName={sticker.pack_name}
        items={similar}
      />
    </Container>
  );
}

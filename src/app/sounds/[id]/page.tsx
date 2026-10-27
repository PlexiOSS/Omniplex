import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { AssetDownloadButton } from "@/components/packs/AssetDownloadButton";
import { AssetHero } from "@/components/packs/AssetHero";
import { PlaySoundButton } from "@/components/packs/PlaySoundButton";
import { SimilarPackAssets } from "@/components/packs/SimilarPackAssets";
import { packs, sounds, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { packSoundUrl } from "@/lib/utils/assets";
import {
  isApiUnavailable,
  isNotFoundError,
  nullIfNotFound,
} from "@/lib/utils/errors";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchSound(id: string) {
  try {
    return await sounds.getById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(nullIfNotFound);
      if (resolved?.target_type === "pack_sound") {
        return sounds.getById(resolved.target_id);
      }
    }
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sound = await fetchSound(id).catch(() => null);
  if (!sound) return {};
  return {
    title: sound.name,
    description: `A sound from the "${sound.pack_name}" pack on Omniplex.`,
  };
}

export default async function SoundPage({ params }: Props) {
  const { id } = await params;
  let sound = null;
  try {
    sound = await fetchSound(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!sound) notFound();

  const assetUrl = packSoundUrl(sound.pack_url, sound.id);

  const pack = await packs.getPack(sound.pack_url).catch(() => null);
  const similar = (pack?.sounds ?? [])
    .filter((s) => s.id !== sound.id)
    .slice(0, 6);

  return (
    <Container className="py-10">
      <AssetHero
        backHref="/sounds"
        backLabel="All Sounds"
        preview={
          <PlaySoundButton
            id={sound.id}
            name={sound.name}
            assetUrl={assetUrl}
            packUrl={sound.pack_url}
            packName={sound.pack_name}
          />
        }
        title={sound.name}
        packUrl={sound.pack_url}
        packName={sound.pack_name}
        owner={sound.owner}
        stats={[
          { label: "Downloads", value: formatCount(sound.downloads) },
          {
            label: "Duration",
            value: `${(sound.duration_ms / 1000).toFixed(1)}s`,
          },
          { label: "Uploaded", value: formatRelativeTime(sound.created_at) },
        ]}
        download={
          <AssetDownloadButton
            kind="sound"
            id={sound.id}
            assetUrl={assetUrl}
            fileName={`${sound.name}.mp3`}
            initialDownloads={sound.downloads}
          />
        }
        vanity={sound.vanity}
        basePath="/sounds"
      />

      <SimilarPackAssets
        kind="sound"
        packUrl={sound.pack_url}
        packName={sound.pack_name}
        items={similar}
      />
    </Container>
  );
}

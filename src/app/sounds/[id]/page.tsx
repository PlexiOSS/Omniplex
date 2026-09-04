import { ArrowLeft, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { AssetDownloadButton } from "@/components/packs/AssetDownloadButton";
import { AssetShortLink } from "@/components/packs/AssetShortLink";
import { PlaySoundButton } from "@/components/packs/PlaySoundButton";
import { SimilarPackAssets } from "@/components/packs/SimilarPackAssets";
import { Avatar } from "@/components/ui/Avatar";
import { packs, sounds, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { packSoundUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatRelativeTime } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchSound(id: string) {
  try {
    return await sounds.getById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(() => null);
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
    notFound();
  }
  if (!sound) notFound();

  const assetUrl = packSoundUrl(sound.pack_url, sound.id);

  const pack = await packs.getPack(sound.pack_url).catch(() => null);
  const similar = (pack?.sounds ?? [])
    .filter((s) => s.id !== sound.id)
    .slice(0, 6);

  return (
    <Container className="py-10">
      <Link
        href="/sounds"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All Sounds
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900">
            <PlaySoundButton assetUrl={assetUrl} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {sound.name}
            </h1>
          </div>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Part of{" "}
            <Link
              href={`/packs/${sound.pack_url}`}
              className="font-medium text-accent hover:underline"
            >
              {sound.pack_name}
            </Link>
          </p>

          <SimilarPackAssets
            kind="sound"
            packUrl={sound.pack_url}
            packName={sound.pack_name}
            items={similar}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <AssetDownloadButton
            kind="sound"
            id={sound.id}
            assetUrl={assetUrl}
            fileName={`${sound.name}.mp3`}
            initialDownloads={sound.downloads}
          />

          <AssetShortLink vanity={sound.vanity} basePath="/sounds" />

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <StatRow label="Downloads" value={String(sound.downloads)} />
              <StatRow
                label="Duration"
                value={`${(sound.duration_ms / 1000).toFixed(1)}s`}
              />
              <StatRow
                label="Uploaded"
                value={formatRelativeTime(sound.created_at)}
              />
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Uploaded by
            </h3>
            <Link
              href={`/user/${sound.owner.id}`}
              className="flex items-center gap-2.5"
            >
              <Avatar
                src={sound.owner.avatar}
                alt={sound.owner.username}
                size={32}
              />
              <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                {sound.owner.display_name || sound.owner.username}
              </span>
            </Link>
          </div>

          <Link
            href={`/packs/${sound.pack_url}`}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200 p-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10"
          >
            <Layers size={16} />
            View pack: {sound.pack_name}
          </Link>
        </aside>
      </div>
    </Container>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}

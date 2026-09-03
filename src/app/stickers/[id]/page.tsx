import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { AssetDownloadButton } from "@/components/packs/AssetDownloadButton";
import { AssetShortLink } from "@/components/packs/AssetShortLink";
import { SimilarPackAssets } from "@/components/packs/SimilarPackAssets";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { packs, stickers, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { packStickerUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatRelativeTime } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchSticker(id: string) {
  try {
    return await stickers.getById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(() => null);
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
    notFound();
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
      <Link
        href="/stickers"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All Stickers
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900">
            {/* biome-ignore lint/performance/noImgElement: full-size sticker preview */}
            <img src={assetUrl} alt={sticker.name} width={96} height={96} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {sticker.name}
            </h1>
            {sticker.animated && (
              <Badge variant="info">
                <Sparkles size={11} />
                Animated
              </Badge>
            )}
          </div>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Part of{" "}
            <Link
              href={`/packs/${sticker.pack_url}`}
              className="font-medium text-accent hover:underline"
            >
              {sticker.pack_name}
            </Link>
          </p>

          <SimilarPackAssets
            kind="sticker"
            packUrl={sticker.pack_url}
            packName={sticker.pack_name}
            items={similar}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <AssetDownloadButton
            kind="sticker"
            id={sticker.id}
            assetUrl={assetUrl}
            fileName={`${sticker.name}.${ext}`}
            initialDownloads={sticker.downloads}
          />

          <AssetShortLink vanity={sticker.vanity} basePath="/stickers" />

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <StatRow label="Downloads" value={String(sticker.downloads)} />
              <StatRow
                label="Uploaded"
                value={formatRelativeTime(sticker.created_at)}
              />
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Uploaded by
            </h3>
            <Link
              href={`/user/${sticker.owner.id}`}
              className="flex items-center gap-2.5"
            >
              <Avatar
                src={sticker.owner.avatar}
                alt={sticker.owner.username}
                size={32}
              />
              <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                {sticker.owner.display_name || sticker.owner.username}
              </span>
            </Link>
          </div>

          <Link
            href={`/packs/${sticker.pack_url}`}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200 p-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10"
          >
            <Layers size={16} />
            View pack: {sticker.pack_name}
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

"use client";

import { Check, Copy, Search, Smile, Sparkles, Sticker as StickerIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import {
  EmojiImage,
  isAnimatedSticker,
  StickerMedia,
} from "@/components/servers/EmojiStickerMedia";
import { useFlatEmojis, useFlatStickers } from "@/hooks/useServers";
import type { FlatEmoji, FlatSticker } from "@/lib/api/types";

type Tab = "emojis" | "stickers";

export default function EmojisPage() {
  const [tab, setTab] = useState<Tab>("emojis");
  const [emojiPage, setEmojiPage] = useState(1);
  const [stickerPage, setStickerPage] = useState(1);
  const [query, setQuery] = useState("");

  const emojis = useFlatEmojis(emojiPage);
  const stickers = useFlatStickers(stickerPage);

  const filteredEmojis = useMemo(() => {
    const items = emojis.data?.results ?? [];
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((e) => e.name.toLowerCase().includes(q));
  }, [emojis.data, query]);

  const filteredStickers = useMemo(() => {
    const items = stickers.data?.results ?? [];
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((s) => s.name.toLowerCase().includes(q));
  }, [stickers.data, query]);

  const active = tab === "emojis" ? emojis : stickers;

  const tabs: { key: Tab; label: string; icon: typeof Smile; count: number }[] = [
    { key: "emojis", label: "Emojis", icon: Smile, count: emojis.data?.count ?? 0 },
    {
      key: "stickers",
      label: "Stickers",
      icon: StickerIcon,
      count: stickers.data?.count ?? 0,
    },
  ];

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Emojis &amp; Stickers
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Browse custom emojis and stickers from servers that have opted in
          to showing them.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 sm:border-b-0">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-medium transition-colors sm:pb-0",
                tab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              <Icon size={14} />
              {label}
              {count > 0 && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 sm:w-64"
          />
        </div>
      </div>

      {active.error ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Failed to load {tab}.</p>
        </div>
      ) : active.isLoading ? (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      ) : tab === "emojis" ? (
        filteredEmojis.length === 0 ? (
          <EmptyState query={query} icon={Smile} label="emojis" />
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
              {filteredEmojis.map((emoji) => (
                <FlatEmojiTile key={`${emoji.server_id}-${emoji.id}`} emoji={emoji} />
              ))}
            </div>
            {!query.trim() && emojis.data && (
              <div className="mt-10">
                <Pagination
                  page={emojiPage}
                  total={emojis.data.count}
                  perPage={emojis.data.per_page}
                  onPageChange={setEmojiPage}
                />
              </div>
            )}
          </>
        )
      ) : filteredStickers.length === 0 ? (
        <EmptyState query={query} icon={StickerIcon} label="stickers" />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {filteredStickers.map((sticker) => (
              <FlatStickerTile key={`${sticker.server_id}-${sticker.id}`} sticker={sticker} />
            ))}
          </div>
          {!query.trim() && stickers.data && (
            <div className="mt-10">
              <Pagination
                page={stickerPage}
                total={stickers.data.count}
                perPage={stickers.data.per_page}
                onPageChange={setStickerPage}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}

function EmptyState({
  query,
  icon: Icon,
  label,
}: {
  query: string;
  icon: typeof Smile;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
      <Icon size={24} className="mb-2 text-zinc-300 dark:text-zinc-700" />
      <p className="text-sm">
        {query.trim()
          ? `No ${label} match "${query.trim()}".`
          : `No servers have opted in to showing their ${label} yet.`}
      </p>
    </div>
  );
}

function FlatEmojiTile({ emoji }: { emoji: FlatEmoji }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(`:${emoji.name}:`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`:${emoji.name}: — from ${emoji.server_name} — click to copy`}
      className="group relative flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
    >
      {emoji.animated && (
        <Sparkles size={11} className="absolute right-1.5 top-1.5 text-accent" />
      )}
      <EmojiImage url={emoji.url} name={emoji.name} animated={emoji.animated} />
      <span className="flex w-full items-center justify-center gap-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0 truncate">{emoji.name}</span>
        {copied ? (
          <Check size={10} className="shrink-0 text-emerald-500" />
        ) : (
          <Copy
            size={10}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </span>
    </button>
  );
}

function FlatStickerTile({ sticker }: { sticker: FlatSticker }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(sticker.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`${sticker.name} — from ${sticker.server_name} — click to copy`}
      className="group relative flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
    >
      {isAnimatedSticker(sticker.format) && (
        <Sparkles size={11} className="absolute right-1.5 top-1.5 text-accent" />
      )}
      <StickerMedia url={sticker.url} name={sticker.name} format={sticker.format} />
      <span className="flex w-full items-center justify-center gap-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0 truncate">{sticker.name}</span>
        {copied ? (
          <Check size={10} className="shrink-0 text-emerald-500" />
        ) : (
          <Copy
            size={10}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </span>
    </button>
  );
}

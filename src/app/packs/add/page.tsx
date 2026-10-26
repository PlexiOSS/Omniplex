"use client";

import {
  Bot,
  type LucideIcon,
  Music,
  Package,
  Search as SearchIcon,
  Server,
  Smile,
  Sticker,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { FormSection } from "@/components/forms/FormSection";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { packs, search } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { BASE_URL } from "@/lib/api/config";
import type {
  PackEmojiInput,
  PackSoundInput,
  PackStickerInput,
  PackType,
} from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";
import { packEmojiUrl, packStickerUrl } from "@/lib/utils/assets";
import { EmojiPackBuilder } from "./EmojiPackBuilder";
import { SoundPackBuilder } from "./SoundPackBuilder";
import { StickerPackBuilder } from "./StickerPackBuilder";

type PickedEntity = {
  type: "bot" | "server";
  id: string;
  label: string;
  avatar: string;
};

const MAX_PER_TYPE = 10;
const SITE_HOST = new URL(BASE_URL).host;

const PACK_TYPES: {
  value: PackType;
  label: string;
  description: string;
  icon: LucideIcon;
  noun: string;
  placeholder: string;
}[] = [
  {
    value: "bot",
    label: "Bots",
    description: "Up to 10 bots",
    icon: Bot,
    noun: "bots",
    placeholder: "What ties these bots together?",
  },
  {
    value: "server",
    label: "Servers",
    description: "Up to 10 servers",
    icon: Server,
    noun: "servers",
    placeholder: "What ties these servers together?",
  },
  {
    value: "emoji",
    label: "Emojis",
    description: "Up to 50 uploads",
    icon: Smile,
    noun: "emojis",
    placeholder: "What's the theme of these emojis?",
  },
  {
    value: "sticker",
    label: "Stickers",
    description: "Up to 50 uploads",
    icon: Sticker,
    noun: "stickers",
    placeholder: "What's the theme of these stickers?",
  },
  {
    value: "sound",
    label: "Sounds",
    description: "Up to 50 clips",
    icon: Music,
    noun: "sounds",
    placeholder: "What are these sounds for?",
  },
];

function isPackType(value: string | null): value is PackType {
  return (
    value === "bot" ||
    value === "server" ||
    value === "emoji" ||
    value === "sticker" ||
    value === "sound"
  );
}

function AddPackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isAuthenticated, loading } = useAuth();
  const { me, loading: meLoading } = useMe(session);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const requestedType = searchParams.get("type");
  const [packType, setPackType] = useState<PackType>(
    isPackType(requestedType) ? requestedType : "bot",
  );
  const [form, setForm] = useState({
    name: "",
    url: "",
    short: "",
    tags: [] as string[],
  });
  const [entities, setEntities] = useState<PickedEntity[]>([]);
  const [emojis, setEmojis] = useState<PackEmojiInput[]>([]);
  const [stickers, setStickers] = useState<PackStickerInput[]>([]);
  const [sounds, setSounds] = useState<PackSoundInput[]>([]);
  // Each item is uploaded to S3 keyed by the pack URL field's value *at that
  // moment* (see uploads/route.ts's key() functions) -- editing the URL
  // afterward doesn't move or re-upload anything already stored, so once an
  // item exists the field is locked to prevent silently orphaning it.
  const hasUploadedItems =
    emojis.length > 0 || stickers.length > 0 || sounds.length > 0;
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PickedEntity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || meLoading || !isAuthenticated || !session || !me) return null;

  // Only one type is active at a time now, but entities/searchResults may
  // still hold stale picks from before a type switch — filter defensively
  // rather than clearing on every switch, so flipping back and forth
  // doesn't lose work.
  const activeEntities = entities.filter((e) => e.type === packType);
  const activeCount = activeEntities.length;
  const activeType =
    PACK_TYPES.find((pt) => pt.value === packType) ?? PACK_TYPES[0];
  const itemCount =
    packType === "emoji"
      ? emojis.length
      : packType === "sticker"
        ? stickers.length
        : packType === "sound"
          ? sounds.length
          : activeCount;

  function isPicked(type: "bot" | "server", id: string) {
    return entities.some((e) => e.type === type && e.id === id);
  }

  function addEntity(entity: PickedEntity) {
    if (isPicked(entity.type, entity.id)) return;
    if (activeCount >= MAX_PER_TYPE) return;
    setEntities((e) => [...e, entity]);
  }

  function removeEntity(type: "bot" | "server", id: string) {
    setEntities((e) => e.filter((x) => !(x.type === type && x.id === id)));
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (
      !query.trim() ||
      packType === "emoji" ||
      packType === "sticker" ||
      packType === "sound"
    )
      return;
    setSearching(true);
    try {
      const res = await search.search({
        query: query.trim(),
        target_types: [packType],
      });
      const bots: PickedEntity[] = (res.bots ?? []).map((b) => ({
        type: "bot",
        id: b.bot_id,
        label: b.user.username,
        avatar: b.user.avatar,
      }));
      const servers: PickedEntity[] = (res.servers ?? []).map((s) => ({
        type: "server",
        id: s.server_id,
        label: s.name,
        avatar:
          s.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&size=64&background=random`,
      }));
      setSearchResults([...bots, ...servers]);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Pack name is required.");
    if (!form.url.trim()) return setError("Pack URL is required.");
    if (!form.short.trim()) return setError("Short description is required.");
    if (packType === "bot" && activeCount === 0)
      return setError("Add at least one bot.");
    if (packType === "server" && activeCount === 0)
      return setError("Add at least one server.");
    if (packType === "emoji" && emojis.length === 0)
      return setError("Add at least one emoji.");
    if (packType === "sticker" && stickers.length === 0)
      return setError("Add at least one sticker.");
    if (packType === "sound" && sounds.length === 0)
      return setError("Add at least one sound.");

    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      await packs.createPack(
        session.user_id,
        {
          name: form.name.trim(),
          url: form.url.trim(),
          short: form.short.trim(),
          tags: form.tags,
          pack_type: packType,
          bots: packType === "bot" ? activeEntities.map((e) => e.id) : [],
          servers: packType === "server" ? activeEntities.map((e) => e.id) : [],
          emojis: packType === "emoji" ? emojis : [],
          stickers: packType === "sticker" ? stickers : [],
          sounds: packType === "sound" ? sounds : [],
        },
        session.token,
      );
      router.push(`/packs/${form.url.trim()}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create pack. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const previewImages =
    packType === "emoji"
      ? emojis.slice(0, 8).map((x) => packEmojiUrl(form.url, x.id, x.animated))
      : packType === "sticker"
        ? stickers
            .slice(0, 8)
            .map((x) => packStickerUrl(form.url, x.id, x.animated))
        : [];

  return (
    <Container className="py-10">
      <PageHeader
        icon={Package}
        title="Create a Pack"
        description="Group bots, servers, emojis, stickers or sounds into a themed collection. They don't have to be yours."
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="min-w-0 space-y-4">
          <FormSection
            step={1}
            title="What's in it?"
            description="A pack holds one kind of thing."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PACK_TYPES.map((pt) => {
                const active = packType === pt.value;
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setPackType(pt.value)}
                    aria-pressed={active}
                    className={[
                      "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                        : "border-zinc-200 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-accent text-accent-fg"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      <Icon size={16} />
                    </span>
                    <span>
                      <span
                        className={[
                          "block text-sm font-medium",
                          active
                            ? "text-accent"
                            : "text-zinc-800 dark:text-zinc-200",
                        ].join(" ")}
                      >
                        {pt.label}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {pt.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </FormSection>

          <FormSection
            step={2}
            title="Details"
            description="How your pack shows up in listings and search."
          >
            <div className="space-y-4">
              <Input
                id="name"
                label="Pack Name"
                placeholder="Moderation Essentials"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />

              <div>
                <label
                  htmlFor="url"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Pack URL <span className="text-red-500">*</span>
                </label>
                <div
                  className={[
                    "flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-white text-sm transition-colors focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600",
                    hasUploadedItems ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <span className="shrink-0 border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    {SITE_HOST}/packs/
                  </span>
                  <input
                    id="url"
                    placeholder="moderation-essentials"
                    value={form.url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, url: e.target.value.trim() }))
                    }
                    disabled={hasUploadedItems}
                    required
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-zinc-950 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed dark:text-zinc-50 dark:placeholder:text-zinc-600"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {hasUploadedItems
                    ? "Locked once you've uploaded an item, since uploads are stored under this URL. Remove all items to change it."
                    : packType === "emoji" ||
                        packType === "sticker" ||
                        packType === "sound"
                      ? "Pick this before uploading. It locks after your first upload."
                      : "Lowercase letters, numbers and dashes work best."}
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label
                    htmlFor="short"
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs tabular-nums text-zinc-400">
                    {form.short.length}/100
                  </span>
                </div>
                <textarea
                  id="short"
                  rows={2}
                  maxLength={100}
                  value={form.short}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, short: e.target.value }))
                  }
                  placeholder={activeType.placeholder}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                  required
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tags
                </p>
                <TagPicker
                  available={BOT_TAGS}
                  selected={form.tags}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            step={3}
            title={`Add ${activeType.noun}`}
            description={
              packType === "bot" || packType === "server"
                ? `Search for ${activeType.noun} listed on Omniplex. Up to ${MAX_PER_TYPE}.`
                : `Upload your ${activeType.noun}. Up to 50.`
            }
          >
            {packType === "emoji" ? (
              <EmojiPackBuilder
                packUrl={form.url}
                userId={session.user_id}
                token={session.token}
                emojis={emojis}
                onChange={setEmojis}
              />
            ) : packType === "sticker" ? (
              <StickerPackBuilder
                packUrl={form.url}
                userId={session.user_id}
                token={session.token}
                stickers={stickers}
                onChange={setStickers}
              />
            ) : packType === "sound" ? (
              <SoundPackBuilder
                packUrl={form.url}
                userId={session.user_id}
                token={session.token}
                sounds={sounds}
                onChange={setSounds}
              />
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <SearchIcon
                      size={14}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch(e);
                        }
                      }}
                      placeholder={`Search ${activeType.noun} by name…`}
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pr-3 pl-9 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={searching}
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
                    {searchResults.map((result) => {
                      const picked = isPicked(result.type, result.id);
                      const atLimit = activeCount >= MAX_PER_TYPE;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          disabled={picked || atLimit}
                          onClick={() => addEntity(result)}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 p-2.5 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                        >
                          <Avatar
                            src={result.avatar}
                            alt={result.label}
                            size={28}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                            {result.label}
                          </span>
                          <span className="shrink-0 text-xs text-accent">
                            {picked ? "Added" : "Add"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {packType === "bot" && me.user_bots.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Quick-add your bots
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {me.user_bots.map((bot) => {
                        const picked = isPicked("bot", bot.bot_id);
                        return (
                          <button
                            key={bot.bot_id}
                            type="button"
                            disabled={picked || activeCount >= MAX_PER_TYPE}
                            onClick={() =>
                              addEntity({
                                type: "bot",
                                id: bot.bot_id,
                                label: bot.user.username,
                                avatar: bot.user.avatar,
                              })
                            }
                            className={[
                              "flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                              picked
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-400",
                            ].join(" ")}
                          >
                            <Avatar
                              src={bot.user.avatar}
                              alt={bot.user.username}
                              size={18}
                            />
                            {bot.user.username}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    In this pack ({activeCount}/{MAX_PER_TYPE})
                  </p>
                  {activeEntities.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {activeEntities.map((entity) => (
                        <div
                          key={`${entity.type}-${entity.id}`}
                          className="flex min-w-0 items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <Avatar
                            src={entity.avatar}
                            alt={entity.label}
                            size={28}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
                            {entity.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEntity(entity.type, entity.id)}
                            aria-label={`Remove ${entity.label}`}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      Nothing added yet. Search above to add {activeType.noun}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </FormSection>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Preview
              </p>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
                    <activeType.icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                      {form.name.trim() || "Your pack name"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {itemCount} {activeType.noun}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {form.short.trim() || activeType.placeholder}
                </p>

                {(packType === "bot" || packType === "server") &&
                  activeEntities.length > 0 && (
                    <div className="mt-4 flex -space-x-2">
                      {activeEntities.slice(0, 8).map((e) => (
                        <span
                          key={e.id}
                          className="rounded-full ring-2 ring-white dark:ring-zinc-900"
                        >
                          <Avatar src={e.avatar} alt={e.label} size={28} />
                        </span>
                      ))}
                    </div>
                  )}
                {previewImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-8 gap-1">
                    {previewImages.map((src) => (
                      // biome-ignore lint/performance/noImgElement: uploaded pack asset preview
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="aspect-square w-full object-contain"
                      />
                    ))}
                  </div>
                )}

                {form.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {form.tags.slice(0, 5).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              size="lg"
              className="w-full"
            >
              Create Pack
            </Button>
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              You can edit or delete it later from your dashboard.
            </p>
          </div>
        </aside>
      </form>
    </Container>
  );
}

export default function AddPackPage() {
  return (
    <Suspense fallback={null}>
      <AddPackForm />
    </Suspense>
  );
}

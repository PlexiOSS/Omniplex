"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { packs, search } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { PackEmojiInput, PackType } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";
import { EmojiPackBuilder } from "./EmojiPackBuilder";

type PickedEntity = {
  type: "bot" | "server";
  id: string;
  label: string;
  avatar: string;
};

const MAX_PER_TYPE = 10;

const PACK_TYPES: { value: PackType; label: string; description: string }[] = [
  { value: "bot", label: "Bot Pack", description: "Bundle up to 10 bots" },
  {
    value: "server",
    label: "Server Pack",
    description: "Bundle up to 10 servers",
  },
  {
    value: "emoji",
    label: "Emoji Pack",
    description: "Bundle up to 50 emojis you upload",
  },
];

function isPackType(value: string | null): value is PackType {
  return value === "bot" || value === "server" || value === "emoji";
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
    if (!query.trim() || packType === "emoji") return;
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
          bots:
            packType === "bot"
              ? activeEntities.map((e) => e.id)
              : [],
          servers:
            packType === "server"
              ? activeEntities.map((e) => e.id)
              : [],
          emojis: packType === "emoji" ? emojis : [],
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

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Add a Pack
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Group bots, servers, or emojis into a themed collection they
            don't have to be yours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Pack Type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PACK_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPackType(pt.value)}
                  className={[
                    "rounded-xl border p-3 text-left transition-colors",
                    packType === pt.value
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-400",
                  ].join(" ")}
                >
                  <span className="block text-sm font-medium">
                    {pt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-600">
                    {pt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Input
            id="name"
            label="Pack Name"
            placeholder="Moderation Essentials"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <Input
            id="url"
            label="Pack URL"
            placeholder="moderation-essentials"
            value={form.url}
            onChange={(e) =>
              setForm((f) => ({ ...f, url: e.target.value.trim() }))
            }
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="short"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="short"
              rows={2}
              maxLength={100}
              value={form.short}
              onChange={(e) =>
                setForm((f) => ({ ...f, short: e.target.value }))
              }
              placeholder="What ties these bots together?"
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
            />
            <p className="text-right text-xs text-zinc-400">
              {form.short.length}/100
            </p>
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

          {packType === "emoji" ? (
            <EmojiPackBuilder
              packUrl={form.url}
              userId={session.user_id}
              token={session.token}
              emojis={emojis}
              onChange={setEmojis}
            />
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {packType === "bot" ? "Bots" : "Servers"}{" "}
                <span className="text-red-500">*</span>{" "}
                <span className="text-xs font-normal text-zinc-400">
                  ({activeCount}/{MAX_PER_TYPE})
                </span>
              </p>

              {activeEntities.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {activeEntities.map((entity) => (
                    <span
                      key={`${entity.type}-${entity.id}`}
                      className="flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pr-1.5 pl-2 text-xs dark:border-zinc-800"
                    >
                      <Avatar src={entity.avatar} alt={entity.label} size={16} />
                      {entity.label}
                      <button
                        type="button"
                        onClick={() => removeEntity(entity.type, entity.id)}
                        aria-label={`Remove ${entity.label}`}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
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
                  placeholder={`Search ${packType === "bot" ? "bots" : "servers"} by name…`}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={searching}
                  onClick={handleSearch}
                >
                  <SearchIcon size={14} />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1.5">
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
                          size={24}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {result.label}
                        </span>
                        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                          {result.type === "bot" ? "Bot" : "Server"}
                        </span>
                        {picked && (
                          <span className="shrink-0 text-xs text-accent">
                            Added
                          </span>
                        )}
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
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            picked
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-400",
                          ].join(" ")}
                        >
                          {bot.user.username}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
        </form>
      </div>
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

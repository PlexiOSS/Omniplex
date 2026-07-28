"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { packs } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { BOT_TAGS } from "@/lib/constants/tags";

export default function AddPackPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();
  const { me, loading: meLoading } = useMe(session);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm] = useState({
    name: "",
    url: "",
    short: "",
    tags: [] as string[],
    bots: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || meLoading || !isAuthenticated || !session || !me) return null;

  function toggleBot(botId: string) {
    setForm((f) => ({
      ...f,
      bots: f.bots.includes(botId)
        ? f.bots.filter((id) => id !== botId)
        : f.bots.length < 10
          ? [...f.bots, botId]
          : f.bots,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Pack name is required.");
    if (!form.url.trim()) return setError("Pack URL is required.");
    if (!form.short.trim()) return setError("Short description is required.");
    if (form.bots.length === 0) return setError("Select at least one bot.");

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
          bots: form.bots,
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
            Group up to 10 of your bots into a themed collection.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Bots <span className="text-red-500">*</span>{" "}
              <span className="text-xs font-normal text-zinc-400">
                ({form.bots.length}/10 selected)
              </span>
            </p>
            {me.user_bots.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You don't have any bots listed yet.
              </p>
            ) : (
              <div className="space-y-2">
                {me.user_bots.map((bot) => {
                  const checked = form.bots.includes(bot.bot_id);
                  return (
                    <label
                      key={bot.bot_id}
                      className={[
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                        checked
                          ? "border-accent bg-accent/5"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBot(bot.bot_id)}
                        className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                      />
                      <Avatar
                        src={bot.user.avatar}
                        alt={bot.user.username}
                        size={28}
                      />
                      <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {bot.user.username}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
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
        </form>
      </div>
    </Container>
  );
}

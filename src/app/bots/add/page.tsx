"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { bots } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { BOT_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";

export default function AddBotPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm] = useState({
    bot_id: "",
    short: "",
    long: "",
    prefix: "",
    library: "",
    invite: "",
    nsfw: false,
    tags: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isAuthenticated || !session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bot_id.trim()) {
      setError("Bot ID is required.");
      return;
    }
    if (!form.short.trim()) {
      setError("Short description is required.");
      return;
    }

    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      const extra_links = form.invite
        ? [{ name: "invite", value: form.invite }]
        : [];

      const bot = await bots.createBot(
        {
          bot_id: form.bot_id.trim(),
          short: form.short.trim(),
          long: form.long.trim() || undefined,
          prefix: form.prefix.trim() || undefined,
          library: form.library.trim() || undefined,
          nsfw: form.nsfw,
          tags: form.tags,
          extra_links,
        },
        session.token,
      );
      router.push(`/bots/${bot.vanity || bot.bot_id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to submit bot. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Add a Bot
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Submit your Discord bot for review. You'll need the bot's Discord
            user ID find it in the{" "}
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-accent underline-offset-2"
            >
              Developer Portal
            </a>
            .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bot ID */}
          <Input
            id="bot_id"
            label="Bot ID"
            placeholder="123456789012345678"
            value={form.bot_id}
            onChange={(e) => setForm((f) => ({ ...f, bot_id: e.target.value }))}
            required
          />

          {/* Short description */}
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
              maxLength={191}
              value={form.short}
              onChange={(e) =>
                setForm((f) => ({ ...f, short: e.target.value }))
              }
              placeholder="One or two sentences describing what your bot does."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
            />
            <p className="text-xs text-right text-zinc-400">
              {form.short.length}/191
            </p>
          </div>

          {/* Invite URL */}
          <Input
            id="invite"
            label="Invite URL"
            type="url"
            placeholder="https://discord.com/oauth2/authorize?client_id=..."
            value={form.invite}
            onChange={(e) => setForm((f) => ({ ...f, invite: e.target.value }))}
          />

          {/* Prefix */}
          <Input
            id="prefix"
            label="Prefix"
            placeholder="! / $ / . (leave blank if slash-command only)"
            value={form.prefix}
            onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))}
          />

          {/* Library */}
          <Input
            id="library"
            label="Library"
            placeholder="discord.js, discord.py, serenity…"
            value={form.library}
            onChange={(e) =>
              setForm((f) => ({ ...f, library: e.target.value }))
            }
          />

          {/* Tags */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags
            </p>
            <TagPicker
              available={AVAILABLE_TAGS}
              selected={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            />
          </div>

          {/* Long description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="long"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Long Description{" "}
              <span className="text-xs text-zinc-400">(HTML supported)</span>
            </label>
            <textarea
              id="long"
              rows={8}
              value={form.long}
              onChange={(e) => setForm((f) => ({ ...f, long: e.target.value }))}
              placeholder="Describe your bot in detail — features, commands, setup instructions…"
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
          </div>

          {/* NSFW */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.nsfw}
              onChange={(e) =>
                setForm((f) => ({ ...f, nsfw: e.target.checked }))
              }
              className="w-4 h-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              This bot contains NSFW content
            </span>
          </label>

          {error && (
            <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
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
            Submit Bot
          </Button>
        </form>
      </div>
    </Container>
  );
}

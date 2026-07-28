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

  function validate(): string | null {
    if (!form.bot_id.trim()) return "Bot ID is required.";
    if (form.short.trim().length < 30)
      return "Short description must be at least 30 characters.";
    if (form.long.trim().length < 500)
      return "Long description must be at least 500 characters.";
    if (!form.prefix.trim()) return "Prefix is required.";
    if (!form.library.trim()) return "Library is required.";
    if (!form.invite.trim() || !form.invite.trim().startsWith("https://"))
      return "Invite URL is required and must be a valid HTTPS URL.";
    if (form.tags.length === 0) return "Select at least one tag.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      const botId = form.bot_id.trim();
      const invite = form.invite.trim();

      await bots.createBot(
        {
          bot_id: botId,
          // The Discord application ID is the same as the bot's user ID for
          // virtually all bots — there's no separate field for this in the
          // add-bot form since it would rarely differ in practice.
          client_id: botId,
          short: form.short.trim(),
          long: form.long.trim(),
          prefix: form.prefix.trim(),
          invite,
          library: form.library.trim(),
          nsfw: form.nsfw,
          tags: form.tags,
          extra_links: [{ name: "invite", value: invite }],
        },
        session.token,
      );
      // The API returns 204 No Content on success, so redirect using the
      // bot ID we already know rather than a vanity from the response.
      router.push(`/bots/${botId}`);
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
              {form.short.length}/191 (30 minimum)
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
            required
          />

          {/* Prefix */}
          <Input
            id="prefix"
            label="Prefix"
            placeholder="! / $ / . / (use / for slash-command only bots)"
            maxLength={10}
            value={form.prefix}
            onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))}
            required
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
            required
          />

          {/* Tags */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags <span className="text-red-500">*</span>
              <span className="ml-1 text-xs font-normal text-zinc-400">
                (1-5)
              </span>
            </p>
            <TagPicker
              available={AVAILABLE_TAGS}
              selected={form.tags}
              onChange={(tags) =>
                setForm((f) => ({ ...f, tags: tags.slice(0, 5) }))
              }
            />
          </div>

          {/* Long description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="long"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Long Description <span className="text-red-500">*</span>{" "}
              <span className="text-xs text-zinc-400">(HTML supported)</span>
            </label>
            <textarea
              id="long"
              rows={8}
              value={form.long}
              onChange={(e) => setForm((f) => ({ ...f, long: e.target.value }))}
              placeholder="Describe your bot in detail — features, commands, setup instructions…"
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
            />
            <p className="text-xs text-right text-zinc-400">
              {form.long.length} characters (500 minimum)
            </p>
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

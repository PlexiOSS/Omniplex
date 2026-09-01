"use client";

import { BookOpen, Pencil, Server, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
import { TeamPicker } from "@/components/teams/TeamPicker";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { usePersistedFormDraft } from "@/hooks/usePersistedFormDraft";
import { bots } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link as ApiLink, DiscordBotMeta } from "@/lib/api/types";
import { suspiciousMarkupError } from "@/lib/utils/detectSuspiciousContent";
import { BOT_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";
import { formatCount } from "@/lib/utils/format";

interface AddBotDraft {
  bot_id: string;
  short: string;
  long: string;
  prefix: string;
  library: string;
  invite: string;
  nsfw: boolean;
  tags: string[];
  links: ApiLink[];
  /** "" means "create a new team for this". */
  team_owner: string;
}

const DRAFT_DEFAULT: AddBotDraft = {
  bot_id: "",
  short: "",
  long: "",
  prefix: "",
  library: "",
  invite: "",
  nsfw: false,
  tags: [],
  links: [],
  team_owner: "",
};

const ALREADY_LISTED_TYPES = new Set(["approved", "certified"]);

export default function AddBotPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm, clearDraft] = usePersistedFormDraft<AddBotDraft>(
    "bots/add",
    session?.user_id,
    DRAFT_DEFAULT,
  );
  const { me } = useMe(session);

  const [botMeta, setBotMeta] = useState<DiscordBotMeta | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [needsFallback, setNeedsFallback] = useState(false);
  const [fallbackBotId, setFallbackBotId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isAuthenticated || !session) return null;

  const botIdConfirmed = botMeta?.client_id === form.bot_id.trim();

  async function lookupBot() {
    const botId = form.bot_id.trim();
    if (!/^\d{17,20}$/.test(botId)) {
      setLookupError("Enter a valid Discord bot/client ID.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const meta = await bots.getBotMeta(
        botId,
        session?.token ?? "",
        fallbackBotId.trim() || undefined,
      );

      if (ALREADY_LISTED_TYPES.has(meta.list_type)) {
        setLookupError(
          "This bot is already listed. Edit it from your dashboard instead of resubmitting.",
        );
        return;
      }
      if (meta.list_type && meta.list_type !== "denied") {
        setLookupError(
          `This bot already has a submission in progress (status: ${meta.list_type}).`,
        );
        return;
      }
      if (!meta.bot_public) {
        setLookupError(
          'This bot isn\'t public. Enable "Public Bot" for it in the Discord Developer Portal, then try again.',
        );
        return;
      }

      setNeedsFallback(false);
      setConfirmed(false);
      setBotMeta(meta);
    } catch (err) {
      if (err instanceof ApiError && err.message === "fallbackNeeded") {
        setNeedsFallback(true);
        setLookupError(
          "We couldn't verify this bot automatically. Enter a fallback bot ID below (usually the same as the client ID) and try again.",
        );
      } else {
        setLookupError(
          err instanceof ApiError ? err.message : "Failed to look up bot.",
        );
      }
    } finally {
      setLookupLoading(false);
    }
  }

  function changeBot() {
    setBotMeta(null);
    setConfirmed(false);
    setLookupError(null);
    setNeedsFallback(false);
  }

  function validate(): string | null {
    if (!botIdConfirmed || !botMeta) return "Look up the bot's ID first.";
    if (form.short.trim().length < 30)
      return "Short description must be at least 30 characters.";
    if (form.long.trim().length < 500)
      return "Long description must be at least 500 characters.";
    const shortMarkupError = suspiciousMarkupError(
      "Short description",
      form.short,
    );
    if (shortMarkupError) return shortMarkupError;
    const longMarkupError = suspiciousMarkupError(
      "Long description",
      form.long,
    );
    if (longMarkupError) return longMarkupError;
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

    if (!session || !botMeta) return;
    setSubmitting(true);
    setError(null);

    try {
      const invite = form.invite.trim();

      await bots.createBot(
        {
          bot_id: botMeta.bot_id,
          client_id: botMeta.client_id,
          short: form.short.trim(),
          long: form.long.trim(),
          prefix: form.prefix.trim(),
          invite,
          library: form.library.trim(),
          nsfw: form.nsfw,
          tags: form.tags,
          extra_links: [
            { name: "Invite", value: invite },
            ...form.links.filter((l) => l.name.trim() && l.value.trim()),
          ],
          team_owner: form.team_owner || undefined,
        },
        session.token,
      );
      clearDraft();
      // The API returns 204 No Content on success, so redirect using the
      // bot ID we already know rather than a vanity from the response.
      router.push(`/bots/${botMeta.bot_id}`);
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

        <div className="flex items-start gap-3 p-4 mb-6 text-sm border rounded-xl border-accent/20 bg-accent/5 text-zinc-700 dark:text-zinc-300">
          <BookOpen size={16} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Before submitting, please read the{" "}
            <Link
              href="/kb/bots/rules"
              className="font-medium underline text-accent underline-offset-2"
            >
              Bot Rules
            </Link>{" "}
            and{" "}
            <Link
              href="/kb/bots/page-rules"
              className="font-medium underline text-accent underline-offset-2"
            >
              Page Rules
            </Link>
            . Bots that don't follow them will be denied.
          </p>
        </div>

        {!botMeta || !botIdConfirmed ? (
          <div className="space-y-4">
            <Input
              id="bot_id"
              label="Bot ID"
              placeholder="123456789012345678"
              value={form.bot_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, bot_id: e.target.value }))
              }
              required
            />

            {needsFallback && (
              <Input
                id="fallback_bot_id"
                label="Fallback Bot ID"
                placeholder="Usually the same as the Bot ID above"
                value={fallbackBotId}
                onChange={(e) => setFallbackBotId(e.target.value)}
              />
            )}

            {lookupError && (
              <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {lookupError}
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              loading={lookupLoading}
              onClick={lookupBot}
              className="w-full"
            >
              Look up bot
            </Button>
          </div>
        ) : !confirmed ? (
          <div className="space-y-4">
            <div className="p-5 border rounded-2xl border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <Avatar src={botMeta.avatar} alt={botMeta.name} size={64} />
                <div className="min-w-0">
                  <p className="text-lg font-semibold truncate text-zinc-950 dark:text-zinc-50">
                    {botMeta.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {botMeta.bot_id}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="success">
                  <ShieldCheck size={11} />
                  Public
                </Badge>
                {botMeta.fallback && (
                  <Badge variant="warning">
                    Limited info (fallback lookup)
                  </Badge>
                )}
                {(botMeta.flags ?? []).map((flag) => (
                  <Badge key={flag}>{flag.replaceAll("_", " ")}</Badge>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                <Server size={14} />
                {formatCount(botMeta.guild_count)} servers reported
              </div>

              {botMeta.description && (
                <p className="mt-3 text-sm line-clamp-3 text-zinc-500 dark:text-zinc-400">
                  {botMeta.description}
                </p>
              )}
            </div>

            {lookupError && (
              <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {lookupError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={() => setConfirmed(true)}
              >
                Looks right — continue
              </Button>
              <Button type="button" variant="ghost" onClick={changeBot}>
                <Pencil size={12} />
                Change
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Fetched bot identity — name comes straight from Discord and
                can't be edited here, it's re-fetched from the Bot ID above. */}
            <div className="flex items-center gap-3 p-3 border rounded-xl border-zinc-200 dark:border-zinc-800">
              <Avatar src={botMeta.avatar} alt={botMeta.name} size={40} />
              <div className="flex-1 min-w-0">
                <Input
                  id="bot_name"
                  label="Bot Name"
                  value={botMeta.name}
                  disabled
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={changeBot}
              >
                <Pencil size={12} />
                Change
              </Button>
            </div>

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
              onChange={(e) =>
                setForm((f) => ({ ...f, invite: e.target.value }))
              }
              required
            />

            {/* Prefix */}
            <Input
              id="prefix"
              label="Prefix"
              placeholder="! / $ / . / (use / for slash-command only bots)"
              maxLength={10}
              value={form.prefix}
              onChange={(e) =>
                setForm((f) => ({ ...f, prefix: e.target.value }))
              }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, long: e.target.value }))
                }
                placeholder="Describe your bot in detail — features, commands, setup instructions…"
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                required
              />
              <p className="text-xs text-right text-zinc-400">
                {form.long.length} characters (500 minimum)
              </p>
            </div>

            {/* Extra links */}
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Extra Links
              </p>
              <LinksEditor
                links={form.links}
                onChange={(links) => setForm((f) => ({ ...f, links }))}
              />
            </div>

            <TeamPicker
              teams={me?.user_teams ?? []}
              currentUserId={session.user_id}
              requiredPerm="add_bots"
              entityLabel="bots"
              value={form.team_owner}
              onChange={(team_owner) =>
                setForm((f) => ({ ...f, team_owner }))
              }
            />

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
        )}
      </div>
    </Container>
  );
}

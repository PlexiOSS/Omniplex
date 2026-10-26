"use client";

import { BookOpen, Bot, Pencil, Server, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InviteCheck } from "@/components/bots/InviteCheck";
import { JoinServerCard } from "@/components/discord/JoinServerCard";
import {
  FieldLabel,
  FormChecklist,
  FormError,
  FormLayout,
  FormSection,
  FormSteps,
  NsfwToggle,
  TEXTAREA_CLASS,
} from "@/components/forms/FormSection";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { BOT_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";
import { suspiciousMarkupError } from "@/lib/utils/detectSuspiciousContent";
import { formatCount } from "@/lib/utils/format";
import { requestsAdministrator } from "@/lib/utils/invitePermissions";

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
    if (requestsAdministrator(form.invite.trim()))
      return "Your invite link requests Administrator, which Omniplex doesn't accept. Request only the permissions your bot uses.";
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

  const stage = !botMeta || !botIdConfirmed ? 0 : !confirmed ? 1 : 2;

  const rulesNote = (
    <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
      <BookOpen size={16} className="mt-0.5 shrink-0 text-accent" />
      <p>
        Read the{" "}
        <Link
          href="/kb/bots/rules"
          className="font-medium text-accent underline underline-offset-2"
        >
          Bot Rules
        </Link>{" "}
        and{" "}
        <Link
          href="/kb/bots/page-rules"
          className="font-medium text-accent underline underline-offset-2"
        >
          Page Rules
        </Link>{" "}
        first. Bots that don't follow them are denied.
      </p>
    </div>
  );

  const prepAside = (
    <>
      <FormChecklist
        title="Before you start"
        items={[
          "Your bot's application ID from the Discord Developer Portal.",
          <>
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">
              Public Bot
            </strong>{" "}
            turned on, so anyone can invite it.
          </>,
          "An invite link that doesn't ask for Administrator.",
          "A short description (30+ characters) and a long one (500+).",
          "A prefix, or / if it only uses slash commands.",
        ]}
      />
      <FormChecklist
        title="What happens next"
        numbered
        items={[
          "Your bot joins the review queue.",
          "A reviewer tests it against the Bot Rules.",
          "You're notified when it's approved, or told why if it's denied.",
        ]}
      />
      {rulesNote}
    </>
  );

  return (
    <Container className="py-10">
      <PageHeader
        icon={Bot}
        title="Add a Bot"
        description="Submit your Discord bot for review. Our staff check every bot before it goes live."
      />
      <FormSteps
        steps={["Find your bot", "Confirm", "Details"]}
        current={stage}
      />

      {stage === 0 ? (
        <FormLayout aside={prepAside}>
          <FormSection
            title="Find your bot"
            description={
              <>
                Paste your bot's application ID from the{" "}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  Developer Portal
                </a>
                . We'll pull in its name and avatar.
              </>
            }
          >
            <div className="space-y-4">
              <Input
                id="bot_id"
                label="Bot ID"
                placeholder="123456789012345678"
                value={form.bot_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bot_id: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lookupBot();
                  }
                }}
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

              {lookupError && <FormError>{lookupError}</FormError>}

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
          </FormSection>
        </FormLayout>
      ) : stage === 1 && botMeta ? (
        <FormLayout aside={prepAside}>
          <FormSection
            title="Is this your bot?"
            description="This comes straight from Discord."
          >
            <div className="flex items-center gap-4">
              <Avatar src={botMeta.avatar} alt={botMeta.name} size={64} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {botMeta.name}
                </p>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {botMeta.bot_id}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="success">
                <ShieldCheck size={11} />
                Public
              </Badge>
              {botMeta.fallback && (
                <Badge variant="warning">Limited info (fallback lookup)</Badge>
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
              <p className="mt-3 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">
                {botMeta.description}
              </p>
            )}

            {lookupError && (
              <div className="mt-4">
                <FormError>{lookupError}</FormError>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={() => setConfirmed(true)}
              >
                Looks right, continue
              </Button>
              <Button type="button" variant="ghost" onClick={changeBot}>
                <Pencil size={12} />
                Change
              </Button>
            </div>
          </FormSection>
        </FormLayout>
      ) : botMeta ? (
        <form onSubmit={handleSubmit}>
          <FormLayout
            aside={
              <>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Preview
                  </p>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={botMeta.avatar}
                        alt={botMeta.name}
                        size={44}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                          {botMeta.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {form.library.trim() || "Library"}
                          {form.prefix.trim() && ` · ${form.prefix.trim()}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={changeBot}
                        aria-label="Change bot"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {form.short.trim() ||
                        "Your short description shows here."}
                    </p>
                    {form.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {form.tags.map((t) => (
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

                {error && <FormError>{error}</FormError>}

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  size="lg"
                  className="w-full"
                >
                  Submit for review
                </Button>
                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Your draft is saved in this browser as you type.
                </p>
                {rulesNote}
              </>
            }
          >
            <JoinServerCard />

            <FormSection
              step={1}
              title="Basics"
              description="How people find and add your bot."
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel
                    htmlFor="short"
                    required
                    count={`${form.short.length}/191`}
                  >
                    Short Description
                  </FieldLabel>
                  <textarea
                    id="short"
                    rows={2}
                    maxLength={191}
                    value={form.short}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, short: e.target.value }))
                    }
                    placeholder="One or two sentences describing what your bot does."
                    className={`resize-none ${TEXTAREA_CLASS}`}
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    At least 30 characters.
                  </p>
                </div>

                <div>
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
                  <InviteCheck invite={form.invite} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="prefix"
                    label="Prefix"
                    placeholder="! or / for slash commands only"
                    maxLength={10}
                    value={form.prefix}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, prefix: e.target.value }))
                    }
                    required
                  />
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
                </div>
              </div>
            </FormSection>

            <FormSection
              step={2}
              title="Tags"
              description="Pick 1 to 5 that describe what your bot does."
            >
              <TagPicker
                available={AVAILABLE_TAGS}
                selected={form.tags}
                onChange={(tags) =>
                  setForm((f) => ({ ...f, tags: tags.slice(0, 5) }))
                }
              />
            </FormSection>

            <FormSection
              step={3}
              title="Long description"
              description="Your bot's page: features, commands and setup. HTML is supported."
            >
              <FieldLabel
                htmlFor="long"
                required
                count={`${form.long.length} / 500 min`}
              >
                Description
              </FieldLabel>
              <textarea
                id="long"
                rows={12}
                value={form.long}
                onChange={(e) =>
                  setForm((f) => ({ ...f, long: e.target.value }))
                }
                placeholder="Describe your bot in detail: features, commands, setup instructions…"
                className={`resize-y ${TEXTAREA_CLASS}`}
                required
              />
            </FormSection>

            <FormSection
              step={4}
              title="Links and ownership"
              description="Support server, website or source code, and who owns the listing."
            >
              <div className="space-y-5">
                <div>
                  <FieldLabel>Extra Links</FieldLabel>
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

                <NsfwToggle
                  checked={form.nsfw}
                  onChange={(nsfw) => setForm((f) => ({ ...f, nsfw }))}
                  label="This bot has NSFW content or commands."
                />
              </div>
            </FormSection>
          </FormLayout>
        </form>
      ) : null}
    </Container>
  );
}

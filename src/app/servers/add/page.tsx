"use client";

import {
  AlertTriangle,
  BookOpen,
  Pencil,
  Server as ServerIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { servers } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link as ApiLink, DiscordServerMeta } from "@/lib/api/types";
import { SERVER_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";
import { suspiciousMarkupError } from "@/lib/utils/detectSuspiciousContent";
import { formatCount } from "@/lib/utils/format";

const LONG_MIN = 500;
const SHORT_MIN = 30;
const SHORT_MAX = 150;

interface AddServerDraft {
  invite: string;
  short: string;
  long: string;
  nsfw: boolean;
  tags: string[];
  links: ApiLink[];
  /** "" means "create a new team for this". */
  team_owner: string;
}

const DRAFT_DEFAULT: AddServerDraft = {
  invite: "",
  short: "",
  long: "",
  nsfw: false,
  tags: [],
  links: [],
  team_owner: "",
};

export default function AddServerPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm, clearDraft] = usePersistedFormDraft<AddServerDraft>(
    "servers/add",
    session?.user_id,
    DRAFT_DEFAULT,
  );
  const { me } = useMe(session);

  const [serverMeta, setServerMeta] = useState<DiscordServerMeta | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isAuthenticated || !session) return null;

  async function lookupServer() {
    const invite = form.invite.trim();
    if (!invite) {
      setLookupError("Enter an invite link first.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const meta = await servers.getServerMeta(invite, session?.token ?? "");

      if (meta.already_listed) {
        setLookupError(
          meta.list_type
            ? `This server is already listed (status: ${meta.list_type}).`
            : "This server is already listed.",
        );
        return;
      }

      setConfirmed(false);
      setServerMeta(meta);
    } catch (err) {
      setLookupError(
        err instanceof ApiError ? err.message : "Failed to look up server.",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  function changeServer() {
    setServerMeta(null);
    setConfirmed(false);
    setLookupError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serverMeta) return setError("Look up the server's invite first.");
    if (form.short.trim().length < SHORT_MIN)
      return setError(
        `Short description must be at least ${SHORT_MIN} characters.`,
      );
    if (form.long.trim().length < LONG_MIN)
      return setError(
        `Long description must be at least ${LONG_MIN} characters.`,
      );
    const shortMarkupError = suspiciousMarkupError(
      "Short description",
      form.short,
    );
    if (shortMarkupError) return setError(shortMarkupError);
    const longMarkupError = suspiciousMarkupError(
      "Long description",
      form.long,
    );
    if (longMarkupError) return setError(longMarkupError);
    if (form.tags.length === 0) return setError("Select at least one tag.");

    if (!session) return;
    setSubmitting(true);
    setError(null);

    // The invite itself always counts as a link so `extra_links` is never
    // empty — Popplio requires at least one.
    const extraLinks: ApiLink[] = [
      { name: "Invite", value: form.invite.trim() },
      ...form.links.filter((l) => l.name.trim() && l.value.trim()),
    ];

    try {
      await servers.createServer(
        {
          invite: form.invite.trim(),
          short: form.short.trim(),
          long: form.long.trim(),
          nsfw: form.nsfw,
          tags: form.tags,
          extra_links: extraLinks,
          team_owner: form.team_owner || undefined,
        },
        session.token,
      );
      clearDraft();
      router.push(`/servers/${serverMeta.server_id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to submit server. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const avatarSrc =
    serverMeta?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(serverMeta?.name ?? "")}&size=64&background=random`;

  const stage = !serverMeta ? 0 : !confirmed ? 1 : 2;

  const rulesNote = (
    <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
      <BookOpen size={16} className="mt-0.5 shrink-0 text-accent" />
      <p>
        Read the{" "}
        <Link
          href="/kb/servers/listing-rules"
          className="font-medium text-accent underline underline-offset-2"
        >
          Listing Rules
        </Link>{" "}
        first. Servers that don't follow them are denied.
      </p>
    </div>
  );

  const prepAside = (
    <>
      <FormChecklist
        title="Before you start"
        items={[
          "An invite link that doesn't expire.",
          "Owner, Manage Server or Administrator in the server.",
          "Our tracking bot in the server. If it isn't there yet, you'll get an invite for it in the next step.",
          "A short description (30+ characters) and a long one (500+).",
        ]}
      />
      <FormChecklist
        title="What happens next"
        numbered
        items={[
          "Your server is listed with your details.",
          "The tracking bot keeps members, emojis and stickers in sync.",
          "Edit everything later from your dashboard.",
        ]}
      />
      {rulesNote}
    </>
  );

  return (
    <Container className="py-10">
      <PageHeader
        icon={ServerIcon}
        title="Add a Server"
        description="Paste an invite link and we'll pull in your server's name, icon and member count."
      />
      <FormSteps
        steps={["Find your server", "Confirm", "Details"]}
        current={stage}
      />

      {stage === 0 ? (
        <FormLayout aside={prepAside}>
          <FormSection
            title="Find your server"
            description="Use an invite that doesn't expire, so people can always join."
          >
            <div className="space-y-4">
              <Input
                id="invite"
                label="Invite URL"
                type="url"
                placeholder="https://discord.gg/yourserver"
                value={form.invite}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invite: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lookupServer();
                  }
                }}
                required
              />

              {lookupError && <FormError>{lookupError}</FormError>}

              <Button
                type="button"
                variant="primary"
                loading={lookupLoading}
                onClick={lookupServer}
                className="w-full"
              >
                Look up server
              </Button>
            </div>
          </FormSection>
        </FormLayout>
      ) : stage === 1 && serverMeta ? (
        <FormLayout aside={prepAside}>
          <FormSection
            title="Is this your server?"
            description="This comes straight from the invite."
          >
            <div className="flex items-center gap-4">
              <Avatar src={avatarSrc} alt={serverMeta.name} size={64} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {serverMeta.name}
                </p>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {serverMeta.server_id}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {formatCount(serverMeta.total_members)} members
              </span>
              {serverMeta.online_members > 0 && (
                <Badge variant="success">
                  {formatCount(serverMeta.online_members)} online
                </Badge>
              )}
            </div>

            {!serverMeta.bot_present && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-400">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>
                  Our tracking bot needs to be in this server before you can
                  list it. It's how we confirm you own or manage the server (you
                  need to be the owner, or have Manage Server or Administrator),
                  and it keeps your member counts, emojis and stickers up to
                  date.
                  {serverMeta.bot_invite_url && (
                    <>
                      {" "}
                      <a
                        href={serverMeta.bot_invite_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-2"
                      >
                        Invite the bot
                      </a>
                      , then check again.
                    </>
                  )}
                </p>
              </div>
            )}

            {lookupError && (
              <div className="mt-4">
                <FormError>{lookupError}</FormError>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              {serverMeta.bot_present ? (
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={() => setConfirmed(true)}
                >
                  Looks right, continue
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  loading={lookupLoading}
                  onClick={lookupServer}
                >
                  I've invited the bot, check again
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={changeServer}>
                <Pencil size={12} />
                Change
              </Button>
            </div>
          </FormSection>
        </FormLayout>
      ) : serverMeta ? (
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
                      <Avatar src={avatarSrc} alt={serverMeta.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                          {serverMeta.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {formatCount(serverMeta.total_members)} members
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={changeServer}
                        aria-label="Change server"
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
              description="The one-liner people see in listings and search."
            >
              <FieldLabel
                htmlFor="short"
                required
                count={`${form.short.length}/${SHORT_MAX}`}
              >
                Short Description
              </FieldLabel>
              <textarea
                id="short"
                rows={2}
                maxLength={SHORT_MAX}
                value={form.short}
                onChange={(e) =>
                  setForm((f) => ({ ...f, short: e.target.value }))
                }
                placeholder="What's your server about?"
                className={`resize-none ${TEXTAREA_CLASS}`}
                required
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                At least {SHORT_MIN} characters.
              </p>
            </FormSection>

            <FormSection
              step={2}
              title="Tags"
              description="Pick the ones that describe your community."
            >
              <TagPicker
                available={AVAILABLE_TAGS}
                selected={form.tags}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
              />
            </FormSection>

            <FormSection
              step={3}
              title="Long description"
              description="Your server's page: community, events and rules. HTML is supported."
            >
              <FieldLabel
                htmlFor="long"
                required
                count={`${form.long.length} / ${LONG_MIN} min`}
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
                placeholder="Tell people what makes your server special: community, events, rules…"
                className={`resize-y ${TEXTAREA_CLASS}`}
                required
              />
            </FormSection>

            <FormSection
              step={4}
              title="Links and ownership"
              description="Website or socials, and who owns the listing."
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
                  requiredPerm="add_servers"
                  entityLabel="servers"
                  value={form.team_owner}
                  onChange={(team_owner) =>
                    setForm((f) => ({ ...f, team_owner }))
                  }
                />

                <NsfwToggle
                  checked={form.nsfw}
                  onChange={(nsfw) => setForm((f) => ({ ...f, nsfw }))}
                  label="This server has NSFW content or channels."
                />
              </div>
            </FormSection>
          </FormLayout>
        </form>
      ) : null}
    </Container>
  );
}

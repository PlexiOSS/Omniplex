"use client";

import { AlertTriangle, BookOpen, Pencil, Users } from "lucide-react";
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
import { servers } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link as ApiLink, DiscordServerMeta } from "@/lib/api/types";
import { SERVER_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";
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

  return (
    <Container className="py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Add a Server
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Paste an invite link and we'll pull in your server's name and member
            count automatically.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 mb-6 text-sm border rounded-xl border-accent/20 bg-accent/5 text-zinc-700 dark:text-zinc-300">
          <BookOpen size={16} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Before submitting, please read the{" "}
            <Link
              href="/kb/servers/listing-rules"
              className="font-medium underline text-accent underline-offset-2"
            >
              Listing Rules
            </Link>
            . Servers that don't follow them will be denied.
          </p>
        </div>

        {!serverMeta ? (
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
              required
            />

            {lookupError && (
              <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {lookupError}
              </div>
            )}

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
        ) : !confirmed ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <Avatar src={avatarSrc} alt={serverMeta.name} size={64} />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {serverMeta.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {serverMeta.server_id}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
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
                    Our tracking bot isn't in this server yet. You can still
                    list it, but features like emoji/sticker display, real
                    invite generation, and live member counts won't work until
                    it's invited.
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
                        , then continue.
                      </>
                    )}
                  </p>
                </div>
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
              <Button type="button" variant="ghost" onClick={changeServer}>
                <Pencil size={12} />
                Change
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Fetched server identity — name comes straight from the
                invite and can't be edited here, it's re-fetched from the
                invite link above. */}
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <Avatar src={avatarSrc} alt={serverMeta.name} size={40} />
              <div className="min-w-0 flex-1">
                <Input
                  id="server_name"
                  label="Server Name"
                  value={serverMeta.name}
                  disabled
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={changeServer}
              >
                <Pencil size={12} />
                Change
              </Button>
            </div>

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
                maxLength={SHORT_MAX}
                value={form.short}
                onChange={(e) =>
                  setForm((f) => ({ ...f, short: e.target.value }))
                }
                placeholder="What's your server about?"
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                required
              />
              <p className="text-xs text-right text-zinc-400">
                {form.short.length}/{SHORT_MAX} (min {SHORT_MIN})
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tags <span className="text-red-500">*</span>
              </p>
              <TagPicker
                available={AVAILABLE_TAGS}
                selected={form.tags}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
              />
            </div>

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
                placeholder="Tell people what makes your server special — community, events, rules…"
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                required
              />
              <p className="text-xs text-right text-zinc-400">
                {form.long.length} characters (min {LONG_MIN})
              </p>
            </div>

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
              requiredPerm="add_servers"
              entityLabel="servers"
              value={form.team_owner}
              onChange={(team_owner) =>
                setForm((f) => ({ ...f, team_owner }))
              }
            />

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
                This server contains NSFW content
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
              Submit Server
            </Button>
          </form>
        )}
      </div>
    </Container>
  );
}

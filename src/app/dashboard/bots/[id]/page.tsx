"use client";

import {
  BarChart2,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Megaphone,
  Sparkles,
  Terminal,
  TriangleAlert,
  Upload,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { BotChangelogSection } from "@/components/bots/BotChangelogSection";
import { BotCommandsSection } from "@/components/bots/BotCommandsSection";
import { InviteCheck } from "@/components/bots/InviteCheck";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
import { TokenManager } from "@/components/sessions/TokenManager";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { useAuth } from "@/hooks/useAuth";
import { useEntityPermission } from "@/hooks/useEntityPermission";
import { useMe } from "@/hooks/useMe";
import { bots, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link as ApiLink, Bot } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";
import { hasPermString } from "@/lib/permissions";
import { bannerUrl, botPath, mirroredAvatarUrl } from "@/lib/utils/assets";
import { suspiciousMarkupError } from "@/lib/utils/detectSuspiciousContent";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { requestsAdministrator } from "@/lib/utils/invitePermissions";
import { UploadError, uploadAsset } from "@/lib/utils/upload";
import {
  FormMessage,
  ManageShell,
  SettingsCard,
  StatGrid,
  TextArea,
  Toggle,
  useSection,
} from "../../manage/ManageShell";

const SECTIONS = [
  "details",
  "appearance",
  "commands",
  "changelog",
  "stats",
  "sessions",
  "webhooks",
  "team",
  "danger",
] as const;
type Section = (typeof SECTIONS)[number];

interface SectionProps {
  bot: Bot;
  userId: string;
  token: string;
  onSaved: () => void;
}

function DetailsSection({ bot, token, onSaved }: SectionProps) {
  const [form, setForm] = useState({
    short: bot.short,
    long: bot.long,
    prefix: bot.prefix,
    invite: bot.invite,
    library: bot.library,
    tags: bot.tags,
    nsfw: bot.nsfw,
    captchaOptOut: bot.captcha_opt_out,
  });
  const [links, setLinks] = useState<ApiLink[]>(bot.extra_links ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const markupError =
      suspiciousMarkupError("Short description", form.short) ??
      suspiciousMarkupError("Long description", form.long);
    if (markupError) return setError(markupError);
    if (requestsAdministrator(form.invite.trim())) {
      return setError(
        "Your invite link requests Administrator, which Omniplex doesn't accept. Request only the permissions your bot uses.",
      );
    }
    setSaving(true);
    setError(null);
    try {
      await bots.updateBot(
        bot.bot_id,
        {
          short: form.short.trim(),
          long: form.long.trim(),
          prefix: form.prefix.trim(),
          invite: form.invite.trim(),
          library: form.library.trim(),
          extra_links: links.filter((l) => l.name.trim() && l.value.trim()),
          tags: form.tags,
          nsfw: form.nsfw,
          captcha_opt_out: form.captchaOptOut,
        },
        token,
      );
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <>
      <FormMessage error={error} success={saved ? "Changes saved." : null} />
      <Button type="submit" variant="primary" loading={saving}>
        Save changes
      </Button>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard
        title="Listing"
        description="What people see on your bot's card and page."
      >
        <TextArea
          id="bot-short"
          label="Short description"
          hint="Shown on cards and in search. 30 to 150 characters."
          rows={2}
          maxLength={150}
          value={form.short}
          onChange={(v) => update("short", v)}
          required
        />
        <TextArea
          id="bot-long"
          label="Long description"
          hint="Markdown and a safe subset of HTML. At least 500 characters."
          rows={12}
          value={form.long}
          onChange={(v) => update("long", v)}
          required
        />
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tags
          </p>
          <TagPicker
            available={BOT_TAGS}
            selected={form.tags}
            onChange={(tags) => update("tags", tags)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Bot details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="bot-prefix"
            label="Prefix"
            value={form.prefix}
            onChange={(e) => update("prefix", e.target.value)}
            required
          />
          <Input
            id="bot-library"
            label="Library"
            value={form.library}
            onChange={(e) => update("library", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Input
            id="bot-invite"
            label="Invite URL"
            type="url"
            value={form.invite}
            onChange={(e) => update("invite", e.target.value)}
            required
          />
          <InviteCheck invite={form.invite} />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Links"
        description="Extra links shown on your bot's page. Links starting with an underscore are private and only used in your description."
      >
        <LinksEditor
          links={links}
          onChange={(next) => {
            setLinks(next);
            setSaved(false);
          }}
        />
      </SettingsCard>

      <SettingsCard title="Options" footer={footer}>
        <Toggle
          checked={form.nsfw}
          onChange={(v) => update("nsfw", v)}
          label="This bot contains NSFW content"
          description="NSFW bots are hidden or blurred for people who've chosen that."
        />
        <Toggle
          checked={form.captchaOptOut}
          onChange={(v) => update("captchaOptOut", v)}
          label="Opt out of captchas"
          description="Voters won't see a captcha for this bot, unless they've chosen to always sponsor captchas."
        />
      </SettingsCard>
    </form>
  );
}

function AppearanceSection({ bot, userId, token, onSaved }: SectionProps) {
  const [bannerVersion, setBannerVersion] = useState<string | null>(
    bot.asset_versions?.banner ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [vanityCode, setVanityCode] = useState(bot.vanity);
  const [savingVanity, setSavingVanity] = useState(false);
  const [vanityError, setVanityError] = useState<string | null>(null);
  const [vanitySaved, setVanitySaved] = useState(false);

  async function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setBannerError(null);
    try {
      setBannerVersion(
        await uploadAsset("bot-banner", bot.bot_id, file, { userId, token }),
      );
      onSaved();
    } catch (err) {
      setBannerError(
        err instanceof UploadError ? err.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveVanity(e: React.FormEvent) {
    e.preventDefault();
    const code = vanityCode.trim();
    if (!code || code === bot.vanity) return;
    setSavingVanity(true);
    setVanityError(null);
    try {
      await vanity.update("bot", bot.bot_id, code, token);
      setVanitySaved(true);
      onSaved();
    } catch (err) {
      setVanityError(
        err instanceof ApiError
          ? err.message
          : "Couldn't change the vanity URL.",
      );
    } finally {
      setSavingVanity(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Banner"
        description="Shown at the top of your bot's page and on its card. WebP, PNG, JPEG or GIF, up to 5MB. Without one, your bot's Discord banner is used."
        footer={
          <>
            <FormMessage error={bannerError} />
            <input
              ref={inputRef}
              type="file"
              accept="image/webp,image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={handleBanner}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={14} />
              {bannerVersion ? "Replace banner" : "Upload banner"}
            </Button>
          </>
        }
      >
        <Banner
          src={bannerUrl("bots", bot.bot_id, bannerVersion)}
          alt={bot.user.username}
          className="h-36 rounded-xl sm:h-48"
        />
      </SettingsCard>

      <form onSubmit={saveVanity}>
        <SettingsCard
          title="Vanity URL"
          description="A custom link for your bot. Lowercase, spaces become hyphens, and each one can only be used once. The ID-based link keeps working."
          footer={
            <>
              <FormMessage
                error={vanityError}
                success={vanitySaved ? "Vanity URL updated." : null}
              />
              <Button
                type="submit"
                variant="primary"
                loading={savingVanity}
                disabled={
                  !vanityCode.trim() || vanityCode.trim() === bot.vanity
                }
              >
                Save vanity URL
              </Button>
            </>
          }
        >
          <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 focus-within:border-zinc-400 dark:border-zinc-800 dark:focus-within:border-zinc-600">
            <span className="shrink-0 border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              omniplex.gg/bots/
            </span>
            <input
              aria-label="Vanity URL"
              value={vanityCode}
              onChange={(e) => {
                setVanityCode(e.target.value);
                setVanitySaved(false);
              }}
              className="min-w-0 flex-1 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
        </SettingsCard>
      </form>
    </div>
  );
}

function StatsSection({ bot }: { bot: Bot }) {
  const uptime =
    bot.total_uptime > 0
      ? `${Math.round((bot.uptime / bot.total_uptime) * 1000) / 10}%`
      : "Not checked yet";
  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Votes this month", value: formatCount(bot.votes) },
          { label: "Servers", value: formatCount(bot.servers) },
          { label: "Shards", value: formatCount(bot.shards) },
          { label: "Page views", value: formatCount(bot.clicks) },
          { label: "Unique page views", value: formatCount(bot.unique_clicks) },
          { label: "Invite clicks", value: formatCount(bot.invite_clicks) },
          { label: "Uptime", value: uptime },
          {
            label: "Last uptime check",
            value: bot.uptime_last_checked
              ? formatRelativeTime(bot.uptime_last_checked)
              : "Never",
          },
        ]}
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Server and shard counts come from your bot posting its stats. See{" "}
        <Link
          href="/kb/developers/posting-stats"
          className="text-accent hover:underline"
        >
          Posting Stats
        </Link>{" "}
        and{" "}
        <Link
          href="/kb/developers/status-and-uptime"
          className="text-accent hover:underline"
        >
          Bot Status &amp; Uptime
        </Link>
        .
      </p>
    </div>
  );
}

function TeamSection({ bot, userId, token, onSaved }: SectionProps) {
  const { session } = useAuth();
  const { me } = useMe(session);
  const currentTeamId = bot.team_owner?.id;
  const candidates = (me?.user_teams ?? []).filter((t) => {
    if (t.id === currentTeamId) return false;
    const flags =
      t.entities?.members?.find((m) => m.user?.id === userId)?.flags ?? [];
    return hasPermString(flags, "add_bots");
  });
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function transfer(e: React.FormEvent) {
    e.preventDefault();
    const target = teamId || candidates[0]?.id;
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await bots.transferTeam(userId, bot.bot_id, { team_id: target }, token);
      setDone(true);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to transfer the bot.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Current owner">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {bot.team_owner ? (
            <>
              Owned by the team{" "}
              <Link
                href={`/teams/${bot.team_owner.id}`}
                className="font-medium text-accent hover:underline"
              >
                {bot.team_owner.name}
              </Link>
              . Members&apos; permissions are managed in the team&apos;s
              settings.
            </>
          ) : (
            "Owned directly by you."
          )}
        </p>
      </SettingsCard>

      <form onSubmit={transfer}>
        <SettingsCard
          title="Move to a team"
          description="Transfers full ownership of this bot to a team. You'll lose direct control unless you're also a member of that team."
          footer={
            candidates.length > 0 ? (
              <>
                <FormMessage
                  error={error}
                  success={done ? "Bot transferred." : null}
                />
                <Button type="submit" variant="primary" loading={saving}>
                  Transfer
                </Button>
              </>
            ) : undefined
          }
        >
          {candidates.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You don&apos;t have the Add Bots permission on any other team.{" "}
              <Link href="/teams/add" className="text-accent hover:underline">
                Create a team
              </Link>{" "}
              first.
            </p>
          ) : (
            <select
              aria-label="Destination team"
              value={teamId || candidates[0]?.id}
              onChange={(e) => setTeamId(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {candidates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </SettingsCard>
      </form>
    </div>
  );
}

function DangerSection({ bot, token }: SectionProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = bot.user.username;

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== name) return;
    setDeleting(true);
    setError(null);
    try {
      await bots.deleteBot(bot.bot_id, token);
      router.push("/dashboard?tab=bots");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete the bot.",
      );
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={remove}>
      <SettingsCard
        tone="danger"
        title="Delete this bot"
        description="Removes the listing, its votes, reviews, commands and changelog. This can't be undone."
        footer={
          <>
            <FormMessage error={error} />
            <Button
              type="submit"
              variant="danger"
              loading={deleting}
              disabled={confirm !== name}
            >
              Delete bot
            </Button>
          </>
        }
      >
        <Input
          id="delete-confirm"
          label={`Type ${name} to confirm`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </SettingsCard>
    </form>
  );
}

function BotSettings() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const [section, setSection] = useSection(SECTIONS, "details");
  const {
    perms,
    hasPerm,
    loading: permsLoading,
  } = useEntityPermission("bot", params.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/auth/login");
  }, [authLoading, isAuthenticated, router]);

  const token = session?.token;
  const {
    data: bot,
    error,
    mutate,
  } = useSWR(token ? ["manage/bot", params.id] : null, () =>
    bots.getBot(params.id, token),
  );
  const { data: commands } = useSWR(
    token && section === "commands" ? ["manage/bot/commands", params.id] : null,
    () => bots.getCommands(params.id, token),
  );
  const { data: changelogs } = useSWR(
    token && section === "changelog"
      ? ["manage/bot/changelogs", params.id]
      : null,
    () => bots.getChangelogs(params.id, token),
  );

  if (error) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Couldn&apos;t load this bot.{" "}
        <Link
          href="/dashboard?tab=bots"
          className="text-accent hover:underline"
        >
          Back to your bots
        </Link>
      </Container>
    );
  }
  if (!session || !bot || permsLoading) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </Container>
    );
  }

  const canEdit = hasPerm("edit_bots");
  const canDelete = hasPerm("delete_bots");
  if (!canEdit) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        You don&apos;t have permission to manage this bot.{" "}
        <Link
          href={botPath(bot.bot_id, bot.vanity)}
          className="text-accent hover:underline"
        >
          View its page
        </Link>
      </Container>
    );
  }

  const props: SectionProps = {
    bot,
    userId: session.user_id,
    token: session.token,
    onSaved: () => mutate(),
  };

  const groups = [
    {
      label: "Listing",
      items: [
        { key: "details" as Section, label: "Details", icon: FileText },
        { key: "appearance" as Section, label: "Appearance", icon: ImageIcon },
        { key: "commands" as Section, label: "Commands", icon: Terminal },
        { key: "changelog" as Section, label: "Changelog", icon: Megaphone },
        { key: "stats" as Section, label: "Statistics", icon: BarChart2 },
      ],
    },
    {
      label: "Developers",
      items: [
        { key: "sessions" as Section, label: "API sessions", icon: KeyRound },
        { key: "webhooks" as Section, label: "Webhooks", icon: WebhookIcon },
      ],
    },
    {
      label: "Ownership",
      items: [
        { key: "team" as Section, label: "Team", icon: Users },
        ...(canDelete
          ? [
              {
                key: "danger" as Section,
                label: "Danger zone",
                icon: TriangleAlert,
              },
            ]
          : []),
      ],
    },
  ];

  const isLive = bot.type === "approved" || bot.type === "certified";

  return (
    <ManageShell
      backHref="/dashboard?tab=bots"
      backLabel="Your bots"
      name={bot.user.username}
      avatar={mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar)}
      viewHref={botPath(bot.bot_id, bot.vanity)}
      badges={
        <>
          {bot.type === "certified" && (
            <Badge variant="success">Certified</Badge>
          )}
          {bot.premium && <Badge variant="premium">Premium</Badge>}
          {!isLive && (
            <Badge variant={bot.type === "denied" ? "danger" : "warning"}>
              {bot.type === "denied" ? "Denied" : "In review"}
            </Badge>
          )}
          {isLive && !bot.premium && (
            <Link
              href={`/premium?bot=${bot.bot_id}`}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/15"
            >
              <Sparkles size={11} />
              Upgrade
            </Link>
          )}
        </>
      }
      groups={groups}
      active={section}
      onSelect={setSection}
    >
      {section === "details" && <DetailsSection key={bot.bot_id} {...props} />}
      {section === "appearance" && <AppearanceSection {...props} />}
      {section === "commands" &&
        (commands ? (
          <BotCommandsSection
            botId={bot.bot_id}
            initialCommands={commands.commands}
            canEdit
            token={session.token}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ))}
      {section === "changelog" &&
        (changelogs ? (
          <BotChangelogSection
            botId={bot.bot_id}
            initialChangelogs={changelogs.changelogs}
            canEdit
            token={session.token}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ))}
      {section === "stats" && <StatsSection bot={bot} />}
      {section === "sessions" && (
        <TokenManager
          targetType="bot"
          targetId={bot.bot_id}
          authToken={session.token}
          myPerms={perms}
        />
      )}
      {section === "webhooks" && (
        <WebhookManager
          targetType="bot"
          targetId={bot.bot_id}
          authToken={session.token}
          canManage={hasPerm("manage_webhooks")}
          canViewLogs={hasPerm("view_webhook_logs")}
        />
      )}
      {section === "team" && <TeamSection {...props} />}
      {section === "danger" && canDelete && <DangerSection {...props} />}
    </ManageShell>
  );
}

export default function BotSettingsPage() {
  return (
    <Suspense>
      <BotSettings />
    </Suspense>
  );
}

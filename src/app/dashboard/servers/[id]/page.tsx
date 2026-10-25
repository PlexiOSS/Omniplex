"use client";

import {
  BarChart2,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Sparkles,
  TriangleAlert,
  Upload,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import useSWR from "swr";
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
import { servers, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link as ApiLink, Server, ServerState } from "@/lib/api/types";
import { SERVER_TAGS } from "@/lib/constants/tags";
import { bannerUrl, mirroredAvatarUrl, serverPath } from "@/lib/utils/assets";
import { formatCount } from "@/lib/utils/format";
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
  "stats",
  "sessions",
  "webhooks",
  "team",
  "danger",
] as const;
type Section = (typeof SECTIONS)[number];

const STATE_OPTIONS: {
  value: ServerState;
  label: string;
  description: string;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Listed and searchable.",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Reachable by link, but hidden from browse and search.",
  },
  {
    value: "private",
    label: "Private",
    description: "Only you and your team can see it.",
  },
  {
    value: "defunct",
    label: "Defunct",
    description: "The server no longer exists or is shutting down.",
  },
];

interface SectionProps {
  server: Server;
  userId: string;
  token: string;
  onSaved: () => void;
}

function DetailsSection({ server, token, onSaved }: SectionProps) {
  const [form, setForm] = useState({
    short: server.short,
    long: server.long,
    state: server.state,
    tags: server.tags,
    nsfw: server.nsfw,
    captchaOptOut: server.captcha_opt_out,
    loginRequiredForInvite: server.login_required_for_invite,
    showEmojis: server.show_emojis,
  });
  const [links, setLinks] = useState<ApiLink[]>(server.extra_links ?? []);
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
    setSaving(true);
    setError(null);
    try {
      await servers.updateServer(
        server.server_id,
        {
          short: form.short.trim(),
          long: form.long.trim(),
          extra_links: links.filter((l) => l.name.trim() && l.value.trim()),
          state: form.state,
          tags: form.tags,
          nsfw: form.nsfw,
          captcha_opt_out: form.captchaOptOut,
          login_required_for_invite: form.loginRequiredForInvite,
          show_emojis: form.showEmojis,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard
        title="Listing"
        description="What people see on your server's card and page."
      >
        <TextArea
          id="server-short"
          label="Short description"
          hint="Shown on cards and in search. 30 to 150 characters."
          rows={2}
          maxLength={150}
          value={form.short}
          onChange={(v) => update("short", v)}
          required
        />
        <TextArea
          id="server-long"
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
            available={SERVER_TAGS}
            selected={form.tags}
            onChange={(tags) => update("tags", tags)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Visibility">
        <div className="grid gap-2 sm:grid-cols-2">
          {STATE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={[
                "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                form.state === opt.value
                  ? "border-accent/50 bg-accent/5"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
              ].join(" ")}
            >
              <input
                type="radio"
                name="server-state"
                checked={form.state === opt.value}
                onChange={() => update("state", opt.value)}
                className="mt-0.5 accent-accent"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {opt.label}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {opt.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Links"
        description="Extra links shown on your server's page."
      >
        <LinksEditor
          links={links}
          onChange={(next) => {
            setLinks(next);
            setSaved(false);
          }}
        />
      </SettingsCard>

      <SettingsCard
        title="Options"
        footer={
          <>
            <FormMessage
              error={error}
              success={saved ? "Changes saved." : null}
            />
            <Button type="submit" variant="primary" loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <Toggle
          checked={form.showEmojis}
          onChange={(v) => update("showEmojis", v)}
          label="Show emojis and stickers on the listing"
          description="Synced while the tracking bot is in your server."
        />
        <Toggle
          checked={form.loginRequiredForInvite}
          onChange={(v) => update("loginRequiredForInvite", v)}
          label="Require sign-in before showing the invite"
        />
        <Toggle
          checked={form.captchaOptOut}
          onChange={(v) => update("captchaOptOut", v)}
          label="Opt out of captchas"
        />
        <Toggle
          checked={form.nsfw}
          onChange={(v) => update("nsfw", v)}
          label="This server contains NSFW content"
        />
      </SettingsCard>
    </form>
  );
}

function AppearanceSection({ server, userId, token, onSaved }: SectionProps) {
  const [bannerVersion, setBannerVersion] = useState<string | null>(
    server.asset_versions?.banner ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [vanityCode, setVanityCode] = useState(server.vanity);
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
        await uploadAsset("server-banner", server.server_id, file, {
          userId,
          token,
        }),
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
    if (!code || code === server.vanity) return;
    setSavingVanity(true);
    setVanityError(null);
    try {
      await vanity.update("server", server.server_id, code, token);
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
        description="Shown at the top of your server's page and on its card. WebP, PNG, JPEG or GIF, up to 5MB."
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
          src={bannerUrl("servers", server.server_id, bannerVersion)}
          alt={server.name}
          className="h-36 rounded-xl sm:h-48"
        />
      </SettingsCard>

      <form onSubmit={saveVanity}>
        <SettingsCard
          title="Vanity URL"
          description="A custom link for your server. Lowercase, spaces become hyphens, and each one can only be used once."
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
                  !vanityCode.trim() || vanityCode.trim() === server.vanity
                }
              >
                Save vanity URL
              </Button>
            </>
          }
        >
          <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 focus-within:border-zinc-400 dark:border-zinc-800 dark:focus-within:border-zinc-600">
            <span className="shrink-0 border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              omniplex.gg/servers/
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

function DangerSection({ server, token }: SectionProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = server.name;

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== name) return;
    setDeleting(true);
    setError(null);
    try {
      await servers.deleteServer(server.server_id, token);
      router.push("/dashboard?tab=servers");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete the server.",
      );
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={remove}>
      <SettingsCard
        tone="danger"
        title="Delete this server"
        description="Removes the listing, its votes and reviews. Your Discord server itself isn't touched. This can't be undone."
        footer={
          <>
            <FormMessage error={error} />
            <Button
              type="submit"
              variant="danger"
              loading={deleting}
              disabled={confirm !== name}
            >
              Delete server
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

function ServerSettings() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const [section, setSection] = useSection(SECTIONS, "details");
  const {
    perms,
    hasPerm,
    loading: permsLoading,
  } = useEntityPermission("server", params.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/auth/login");
  }, [authLoading, isAuthenticated, router]);

  const token = session?.token;
  const {
    data: server,
    error,
    mutate,
  } = useSWR(token ? ["manage/server", params.id] : null, () =>
    servers.getServer(params.id, token),
  );

  if (error) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Couldn&apos;t load this server.{" "}
        <Link
          href="/dashboard?tab=servers"
          className="text-accent hover:underline"
        >
          Back to your servers
        </Link>
      </Container>
    );
  }
  if (!session || !server || permsLoading) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </Container>
    );
  }
  if (!hasPerm("edit_servers")) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        You don&apos;t have permission to manage this server.{" "}
        <Link
          href={serverPath(server.server_id, server.vanity)}
          className="text-accent hover:underline"
        >
          View its page
        </Link>
      </Container>
    );
  }

  const props: SectionProps = {
    server,
    userId: session.user_id,
    token: session.token,
    onSaved: () => mutate(),
  };
  const isLive = server.type === "approved" || server.type === "certified";
  const canDelete = hasPerm("delete_servers");

  const groups = [
    {
      label: "Listing",
      items: [
        { key: "details" as Section, label: "Details", icon: FileText },
        { key: "appearance" as Section, label: "Appearance", icon: ImageIcon },
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

  return (
    <ManageShell
      backHref="/dashboard?tab=servers"
      backLabel="Your servers"
      name={server.name}
      avatar={mirroredAvatarUrl("servers", server.server_id, server.avatar)}
      viewHref={serverPath(server.server_id, server.vanity)}
      badges={
        <>
          {server.type === "certified" && (
            <Badge variant="success">Certified</Badge>
          )}
          {server.premium && <Badge variant="premium">Premium</Badge>}
          {!isLive && (
            <Badge variant={server.type === "denied" ? "danger" : "warning"}>
              {server.type === "denied" ? "Denied" : "In review"}
            </Badge>
          )}
          {isLive && !server.premium && (
            <Link
              href={`/premium?server=${server.server_id}`}
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
      {section === "details" && <DetailsSection {...props} />}
      {section === "appearance" && <AppearanceSection {...props} />}
      {section === "stats" && (
        <StatGrid
          stats={[
            { label: "Members", value: formatCount(server.total_members) },
            { label: "Online now", value: formatCount(server.online_members) },
            { label: "Votes this month", value: formatCount(server.votes) },
            { label: "Page views", value: formatCount(server.clicks) },
            {
              label: "Unique page views",
              value: formatCount(server.unique_clicks),
            },
            {
              label: "Invite clicks",
              value: formatCount(server.invite_clicks),
            },
          ]}
        />
      )}
      {section === "sessions" && (
        <TokenManager
          targetType="server"
          targetId={server.server_id}
          authToken={session.token}
          myPerms={perms}
        />
      )}
      {section === "webhooks" && (
        <WebhookManager
          targetType="server"
          targetId={server.server_id}
          authToken={session.token}
          canManage={hasPerm("manage_webhooks")}
          canViewLogs={hasPerm("view_webhook_logs")}
        />
      )}
      {section === "team" && (
        <SettingsCard
          title="Owning team"
          description="Servers always belong to a team. Manage who can edit this server, and what they can do, in the team's settings."
        >
          {server.team_owner ? (
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href={`/teams/${server.team_owner.id}`}
                className="font-medium text-accent hover:underline"
              >
                {server.team_owner.name}
              </Link>
              <Link
                href={`/teams/${server.team_owner.id}/settings`}
                className="text-zinc-500 hover:text-accent dark:text-zinc-400"
              >
                Team settings
              </Link>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No owning team found.
            </p>
          )}
        </SettingsCard>
      )}
      {section === "danger" && canDelete && <DangerSection {...props} />}
    </ManageShell>
  );
}

export default function ServerSettingsPage() {
  return (
    <Suspense>
      <ServerSettings />
    </Suspense>
  );
}

"use client";

import { servers } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type {
  Link as ApiLink,
  Server,
  ServerState,
} from "@omniplex/core/api/types";
import { Button } from "@omniplex/ui/Button";
import { LinksEditor } from "@omniplex/ui/LinksEditor";
import { TagPicker } from "@omniplex/ui/TagPicker";
import Link from "next/link";
import { useState } from "react";
import { PublicStatsFields } from "@/components/listing/PublicStatsFields";
import { SERVER_TAGS } from "@/lib/constants/tags";
import { SERVER_STAT_OPTIONS } from "@/lib/utils/hiddenStats";
import {
  FormMessage,
  SettingsCard,
  TextArea,
  Toggle,
} from "../../manage/ManageShell";

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

export interface SectionProps {
  server: Server;
  userId: string;
  token: string;
  onSaved: () => void;
}

export function DetailsSection({ server, token, onSaved }: SectionProps) {
  const [form, setForm] = useState({
    short: server.short,
    long: server.long,
    state: server.state,
    tags: server.tags,
    nsfw: server.nsfw,
    captchaOptOut: server.captcha_opt_out,
    acceptAutoVotes: !server.auto_votes_opt_out,
    hiddenStats: server.hidden_stats ?? [],
    cardColor: server.card_color ?? "",
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
          auto_votes_opt_out: !form.acceptAutoVotes,
          hidden_stats: form.hiddenStats,
          ...(server.card_theme ? { card_color: form.cardColor } : {}),
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
          checked={form.acceptAutoVotes}
          onChange={(v) => update("acceptAutoVotes", v)}
          label="Accept automatic votes"
          description="Auto-vote subscribers can vote for this server automatically, without a captcha. Automatic votes never earn vote credits."
        />
        <Toggle
          checked={form.nsfw}
          onChange={(v) => update("nsfw", v)}
          label="This server contains NSFW content"
        />
        <PublicStatsFields
          options={SERVER_STAT_OPTIONS}
          hidden={form.hiddenStats}
          onChange={(v) => update("hiddenStats", v)}
        />
      </SettingsCard>

      <SettingsCard
        title="Card theme"
        description={
          server.card_theme
            ? "Tints this server's card everywhere it appears. Leave it empty for the default look."
            : "Buy Card Theme in the shop to tint this server's card with a colour of your choice."
        }
        footer={
          server.card_theme ? (
            <>
              <FormMessage
                error={error}
                success={saved ? "Changes saved." : null}
              />
              <Button type="submit" variant="primary" loading={saving}>
                Save changes
              </Button>
            </>
          ) : undefined
        }
      >
        {server.card_theme ? (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={form.cardColor || "#5865f2"}
              onChange={(e) => update("cardColor", e.target.value)}
              aria-label="Card colour"
              className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
            />
            <span className="font-mono text-sm text-zinc-600 dark:text-zinc-300">
              {form.cardColor || "Default"}
            </span>
            {form.cardColor && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update("cardColor", "")}
              >
                Reset
              </Button>
            )}
          </div>
        ) : (
          <Link
            href="/shop/items"
            className="text-sm font-medium text-accent hover:underline"
          >
            Open the shop
          </Link>
        )}
      </SettingsCard>
    </form>
  );
}

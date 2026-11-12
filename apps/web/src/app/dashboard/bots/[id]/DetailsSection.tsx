"use client";

import { bots } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { Link as ApiLink, Bot } from "@omniplex/core/api/types";
import { requestsAdministrator } from "@omniplex/core/utils/invitePermissions";
import { Button } from "@omniplex/ui/Button";
import { Input } from "@omniplex/ui/Input";
import { LinksEditor } from "@omniplex/ui/LinksEditor";
import { TagPicker } from "@omniplex/ui/TagPicker";
import { useState } from "react";
import { InviteCheck } from "@/components/bots/InviteCheck";
import { PublicStatsFields } from "@/components/listing/PublicStatsFields";
import { BOT_TAGS } from "@/lib/constants/tags";
import { suspiciousMarkupError } from "@/lib/utils/detectSuspiciousContent";
import { BOT_STAT_OPTIONS } from "@/lib/utils/hiddenStats";
import {
  FormMessage,
  SettingsCard,
  TextArea,
  Toggle,
} from "../../manage/ManageShell";

export interface SectionProps {
  bot: Bot;
  userId: string;
  token: string;
  onSaved: () => void;
}

export function DetailsSection({ bot, token, onSaved }: SectionProps) {
  const [form, setForm] = useState({
    short: bot.short,
    long: bot.long,
    prefix: bot.prefix,
    invite: bot.invite,
    library: bot.library,
    tags: bot.tags,
    nsfw: bot.nsfw,
    captchaOptOut: bot.captcha_opt_out,
    acceptAutoVotes: !bot.auto_votes_opt_out,
    hiddenStats: bot.hidden_stats ?? [],
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
          auto_votes_opt_out: !form.acceptAutoVotes,
          hidden_stats: form.hiddenStats,
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
        <Toggle
          checked={form.acceptAutoVotes}
          onChange={(v) => update("acceptAutoVotes", v)}
          label="Accept automatic votes"
          description="Auto-vote subscribers can vote for this bot automatically, without a captcha. Automatic votes never earn vote credits."
        />
        <PublicStatsFields
          options={BOT_STAT_OPTIONS}
          hidden={form.hiddenStats}
          onChange={(v) => update("hiddenStats", v)}
        />
      </SettingsCard>
    </form>
  );
}

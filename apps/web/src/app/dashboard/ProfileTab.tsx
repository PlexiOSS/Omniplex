"use client";

import { platform, users } from "@omniplex/core/api";
import type {
  Link as ApiLink,
  User as UserType,
} from "@omniplex/core/api/types";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { LinksEditor } from "@omniplex/ui/LinksEditor";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  FormMessage,
  SettingsCard,
  TextArea,
  Toggle,
} from "./manage/ManageShell";

export function EditProfileTab({
  me,
  token,
  mutate,
}: {
  me: UserType;
  token: string;
  mutate: () => void;
}) {
  // Links starting with "_" are private (system-managed) — this editor only
  // manages the public ones a user advertises on their profile. Private
  // links are carried through unchanged on save.
  const privateLinks = me.extra_links.filter((l) => l.name.startsWith("_"));
  const [about, setAbout] = useState(me.about ?? "");
  const [links, setLinks] = useState<ApiLink[]>(
    me.extra_links.filter((l) => !l.name.startsWith("_")),
  );
  const [captchaSponsorEnabled, setCaptchaSponsorEnabled] = useState(
    me.captcha_sponsor_enabled,
  );
  const pinOptions = [
    ...me.user_bots.map((b) => ({
      key: `bot:${b.bot_id}`,
      label: `${b.user?.username ?? b.bot_id} (bot)`,
    })),
    ...me.user_teams.flatMap((t) =>
      (t.entities?.bots ?? []).map((b) => ({
        key: `bot:${b.bot_id}`,
        label: `${b.user?.username ?? b.bot_id} (bot, ${t.name})`,
      })),
    ),
    ...me.user_servers.map((sv) => ({
      key: `server:${sv.server_id}`,
      label: `${sv.name} (server)`,
    })),
  ].filter((o, i, all) => all.findIndex((x) => x.key === o.key) === i);
  const [pinned, setPinned] = useState(
    me.pinned_target_type && me.pinned_target_id
      ? `${me.pinned_target_type}:${me.pinned_target_id}`
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingDiscord, setRefreshingDiscord] = useState(false);
  const [discordRefreshed, setDiscordRefreshed] = useState(false);

  async function handleRefreshDiscord() {
    const discordId = me.user?.id;
    if (!discordId) return;
    setRefreshingDiscord(true);
    setDiscordRefreshed(false);
    try {
      await platform.clearDiscordUser(discordId);
      mutate();
      setDiscordRefreshed(true);
      setTimeout(() => setDiscordRefreshed(false), 3000);
    } catch {
      // Best-effort — the cache just stays as it was.
    } finally {
      setRefreshingDiscord(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const cleanLinks = links.filter(
        (l) => l.name.trim() !== "" && l.value.trim() !== "",
      );
      const extra_links: ApiLink[] = [...privateLinks, ...cleanLinks];
      await users.updateUser(
        me.user?.id ?? "",
        {
          about: about || null,
          extra_links,
          captcha_sponsor_enabled: captchaSponsorEnabled,
          pinned_listing: pinned
            ? {
                target_type: pinned.split(":")[0] as "bot" | "server",
                target_id: pinned.split(":")[1] ?? "",
              }
            : { target_type: "", target_id: "" },
        },
        token,
      );
      mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const previewName = me.user?.display_name || me.user?.username || "Unknown";
  const previewLinks = links.filter((l) => l.name.trim() && l.value.trim());

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        <SettingsCard
          title="Profile"
          description="What people see on your public profile."
          footer={
            <>
              <FormMessage error={error} success={saved ? "Saved." : null} />
              <Button variant="primary" loading={saving} onClick={handleSave}>
                Save changes
              </Button>
            </>
          }
        >
          <TextArea
            id="about"
            label="Bio (Markdown supported)"
            rows={3}
            value={about}
            onChange={setAbout}
          />
          {pinOptions.length > 0 && (
            <div>
              <label
                htmlFor="pinned-listing"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Pinned listing
              </label>
              <select
                id="pinned-listing"
                value={pinned}
                onChange={(e) => setPinned(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="">None</option>
                {pinOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Shown at the top of your public profile.
              </p>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Links
            </p>
            <LinksEditor links={links} onChange={setLinks} />
          </div>
          <Toggle
            checked={captchaSponsorEnabled}
            onChange={setCaptchaSponsorEnabled}
            label="Sponsor captchas"
            description="Show a captcha before voting even on bots and servers that have opted out of them."
          />
        </SettingsCard>

        <SettingsCard
          title="Discord profile"
          description="Username or avatar out of date? This refreshes the copy we show across the site."
          footer={
            <Button
              variant="secondary"
              size="sm"
              loading={refreshingDiscord}
              onClick={handleRefreshDiscord}
            >
              {discordRefreshed ? "Refreshed" : "Refresh from Discord"}
            </Button>
          }
        />
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Preview
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <Avatar
              src={mirroredAvatarUrl(
                "users",
                me.user?.id ?? "",
                me.user?.avatar,
              )}
              alt={previewName}
              size={48}
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                {previewName}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                @{me.user?.username}
              </p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">
            {about.trim() || (
              <span className="text-zinc-400 dark:text-zinc-500">
                No bio yet.
              </span>
            )}
          </p>
          {previewLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {previewLinks.map((link) => (
                <span
                  key={link.name}
                  className="text-xs font-medium capitalize text-accent"
                >
                  {link.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          href={`/user/${me.user?.id ?? ""}`}
          className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
        >
          View public profile <ArrowUpRight size={13} />
        </Link>
      </aside>
    </div>
  );
}

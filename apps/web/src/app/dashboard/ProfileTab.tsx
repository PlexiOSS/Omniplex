"use client";

import { platform, users } from "@omniplex/core/api";
import type {
  Link as ApiLink,
  User as UserType,
} from "@omniplex/core/api/types";
import {
  discordBannerUrl,
  mirroredAvatarUrl,
} from "@omniplex/core/utils/assets";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { LinksEditor } from "@omniplex/ui/LinksEditor";
import { ArrowUpRight, Check, Pin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Markdown } from "@/components/markdown/Markdown";
import { Banner } from "@/components/ui/Banner";
import { LinkIcon } from "@/components/ui/LinkIcon";
import {
  FormMessage,
  SettingsCard,
  TextArea,
  Toggle,
} from "./manage/ManageShell";

const BIO_MAX = 1000;

interface PinOption {
  key: string;
  name: string;
  detail: string;
  avatar: string;
}

function samePins(a: ApiLink[], b: ApiLink[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function EditProfileTab({
  me,
  token,
  mutate,
}: {
  me: UserType;
  token: string;
  mutate: () => void;
}) {
  const privateLinks = me.extra_links.filter((l) => l.name.startsWith("_"));
  const initialLinks = me.extra_links.filter((l) => !l.name.startsWith("_"));
  const initialPinned =
    me.pinned_target_type && me.pinned_target_id
      ? `${me.pinned_target_type}:${me.pinned_target_id}`
      : "";

  const [about, setAbout] = useState(me.about ?? "");
  const [links, setLinks] = useState<ApiLink[]>(initialLinks);
  const [captchaSponsorEnabled, setCaptchaSponsorEnabled] = useState(
    me.captcha_sponsor_enabled,
  );
  const [pinned, setPinned] = useState(initialPinned);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingDiscord, setRefreshingDiscord] = useState(false);
  const [discordRefreshed, setDiscordRefreshed] = useState(false);

  const pinOptions: PinOption[] = [
    ...me.user_bots.map((b) => ({
      key: `bot:${b.bot_id}`,
      name: b.user?.display_name || b.user?.username || b.bot_id,
      detail: "Bot",
      avatar: mirroredAvatarUrl("bots", b.bot_id, b.user?.avatar),
    })),
    ...me.user_teams.flatMap((t) =>
      (t.entities?.bots ?? []).map((b) => ({
        key: `bot:${b.bot_id}`,
        name: b.user?.display_name || b.user?.username || b.bot_id,
        detail: `Bot · ${t.name}`,
        avatar: mirroredAvatarUrl("bots", b.bot_id, b.user?.avatar),
      })),
    ),
    ...me.user_servers.map((sv) => ({
      key: `server:${sv.server_id}`,
      name: sv.name,
      detail: "Server",
      avatar: mirroredAvatarUrl("servers", sv.server_id, sv.avatar),
    })),
  ].filter((o, i, all) => all.findIndex((x) => x.key === o.key) === i);

  const dirty =
    about !== (me.about ?? "") ||
    !samePins(links, initialLinks) ||
    captchaSponsorEnabled !== me.captcha_sponsor_enabled ||
    pinned !== initialPinned;

  async function handleRefreshDiscord() {
    const discordId = me.user?.id;
    if (!discordId) return;
    setRefreshingDiscord(true);
    setDiscordRefreshed(false);
    try {
      await platform.clearDiscordUser(discordId, token);
      mutate();
      setDiscordRefreshed(true);
      setTimeout(() => setDiscordRefreshed(false), 3000);
    } catch {
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
      await users.updateUser(
        me.user?.id ?? "",
        {
          about: about || null,
          extra_links: [...privateLinks, ...cleanLinks],
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
      setError(e instanceof Error ? e.message : "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setAbout(me.about ?? "");
    setLinks(initialLinks);
    setCaptchaSponsorEnabled(me.captcha_sponsor_enabled);
    setPinned(initialPinned);
    setError(null);
  }

  const previewName = me.user?.display_name || me.user?.username || "Unknown";
  const previewLinks = links.filter((l) => l.name.trim() && l.value.trim());
  const pinnedOption = pinOptions.find((o) => o.key === pinned);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        <SettingsCard
          title="About you"
          description="Shown in the About card on your profile. Markdown works, so you can use **bold**, lists and links."
        >
          <TextArea
            id="about"
            label="Bio"
            hint={`${about.length}/${BIO_MAX}`}
            rows={5}
            maxLength={BIO_MAX}
            value={about}
            onChange={setAbout}
          />
        </SettingsCard>

        {pinOptions.length > 0 && (
          <SettingsCard
            title="Pinned listing"
            description="One of your bots or servers, shown at the top of your profile."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <PinChoice
                selected={pinned === ""}
                onSelect={() => setPinned("")}
                name="Nothing pinned"
                detail="Don't show a pinned listing"
              />
              {pinOptions.map((o) => (
                <PinChoice
                  key={o.key}
                  selected={pinned === o.key}
                  onSelect={() => setPinned(o.key)}
                  name={o.name}
                  detail={o.detail}
                  avatar={o.avatar}
                />
              ))}
            </div>
          </SettingsCard>
        )}

        <SettingsCard
          title="Links"
          description="Your website and socials, shown as icons on your profile."
        >
          <LinksEditor links={links} onChange={setLinks} />
        </SettingsCard>

        <SettingsCard
          title="Voting"
          description="Settings for how you vote, not shown on your profile."
        >
          <Toggle
            checked={captchaSponsorEnabled}
            onChange={setCaptchaSponsorEnabled}
            label="Sponsor captchas"
            description="Solve a captcha before every vote, even on bots and servers that have turned them off, to help keep votes fair."
          />
        </SettingsCard>

        <SettingsCard
          title="Discord profile"
          description="Your name, avatar and banner come from Discord. If they look out of date, refresh them here."
          footer={
            <Button
              variant="secondary"
              size="sm"
              loading={refreshingDiscord}
              onClick={handleRefreshDiscord}
            >
              {discordRefreshed ? <Check size={14} /> : <RefreshCw size={14} />}
              {discordRefreshed ? "Refreshed" : "Refresh from Discord"}
            </Button>
          }
        />

        {(dirty || saved || error) && (
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
            <FormMessage
              error={error}
              success={!dirty && saved ? "Saved." : null}
            />
            {dirty && (
              <>
                <p className="mr-auto text-sm text-zinc-600 dark:text-zinc-300">
                  You have unsaved changes.
                </p>
                <Button variant="ghost" disabled={saving} onClick={discard}>
                  Discard
                </Button>
                <Button variant="primary" loading={saving} onClick={handleSave}>
                  Save changes
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Preview
        </p>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Banner
            src={me.user?.id ? discordBannerUrl("users", me.user.id) : null}
            alt={previewName}
            sizeClassName="h-20"
            missingSizeClassName="h-14"
          />
          <div className="px-4 pb-4">
            <div className="-mt-8 inline-block rounded-full bg-white p-1 dark:bg-zinc-900">
              <Avatar
                src={mirroredAvatarUrl(
                  "users",
                  me.user?.id ?? "",
                  me.user?.avatar,
                )}
                alt={previewName}
                size={56}
              />
            </div>
            <p className="mt-1 truncate font-semibold text-zinc-950 dark:text-zinc-50">
              {previewName}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              @{me.user?.username}
            </p>

            {pinnedOption && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200 px-2.5 py-2 dark:border-zinc-800">
                <Avatar
                  src={pinnedOption.avatar}
                  alt={pinnedOption.name}
                  size={24}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-950 dark:text-zinc-50">
                  {pinnedOption.name}
                </span>
                <Pin size={12} className="shrink-0 text-accent" />
              </div>
            )}

            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              {about.trim() ? (
                <Markdown content={about} className="max-w-none text-sm" />
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500">No bio yet.</p>
              )}
            </div>

            {previewLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {previewLinks.map((link) => (
                  <span
                    key={link.name}
                    title={link.name}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <LinkIcon name={link.name} href={link.value} size={14} />
                  </span>
                ))}
              </div>
            )}
          </div>
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

function PinChoice({
  selected,
  onSelect,
  name,
  detail,
  avatar,
}: {
  selected: boolean;
  onSelect: () => void;
  name: string;
  detail: string;
  avatar?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-accent/50 bg-accent/5"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
      ].join(" ")}
    >
      {avatar ? (
        <Avatar src={avatar} alt={name} size={32} />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
          <Pin size={14} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {name}
        </span>
        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
          {detail}
        </span>
      </span>
      {selected && <Check size={16} className="shrink-0 text-accent" />}
    </button>
  );
}

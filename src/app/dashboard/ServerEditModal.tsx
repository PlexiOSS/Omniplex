"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TagPicker } from "@/components/ui/TagPicker";
import { servers } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link, Server, ServerState } from "@/lib/api/types";
import { SERVER_TAGS } from "@/lib/constants/tags";
import { bannerUrl } from "@/lib/utils/assets";
import { UploadError, uploadAsset } from "@/lib/utils/upload";

interface ServerEditModalProps {
  serverId: string;
  userId: string;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ServerEditModal({
  serverId,
  userId,
  token,
  onClose,
  onSaved,
}: ServerEditModalProps) {
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    servers
      .getServer(serverId)
      .then((s) => {
        if (!cancelled) setServer(s);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Failed to load server settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  return (
    <Modal open onClose={onClose} title="Edit Server">
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      ) : loadError || !server ? (
        <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
          {loadError ?? "Server not found."}
        </p>
      ) : (
        <ServerEditForm
          server={server}
          userId={userId}
          token={token}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

const STATE_OPTIONS: { value: ServerState; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "unlisted", label: "Unlisted" },
  { value: "defunct", label: "Defunct" },
];

function ServerEditForm({
  server,
  userId,
  token,
  onClose,
  onSaved,
}: {
  server: Server;
  userId: string;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
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
  const [links, setLinks] = useState<Link[]>(server.extra_links ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bannerVersion, setBannerVersion] = useState(0);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingBanner(true);
    setBannerError(null);
    try {
      await uploadAsset("server-banner", server.server_id, file, {
        userId,
        token,
      });
      setBannerVersion((v) => v + 1);
    } catch (err) {
      setBannerError(
        err instanceof UploadError ? err.message : "Upload failed.",
      );
    } finally {
      setUploadingBanner(false);
    }
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
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Banner
        </p>
        <Banner
          src={`${bannerUrl("servers", server.server_id)}${bannerVersion ? `?v=${bannerVersion}` : ""}`}
          alt={server.name}
          className="h-28 rounded-xl sm:h-36"
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/webp,image/png,image/jpeg,image/gif"
          className="hidden"
          onChange={handleBannerChange}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploadingBanner}
          onClick={() => bannerInputRef.current?.click()}
          className="mt-2"
        >
          <Upload size={14} />
          {bannerVersion ? "Replace banner" : "Upload banner"}
        </Button>
        {bannerError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {bannerError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-server-short"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Short Description
        </label>
        <textarea
          id="edit-server-short"
          rows={2}
          maxLength={150}
          value={form.short}
          onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-server-state"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Visibility
        </label>
        <select
          id="edit-server-state"
          value={form.state}
          onChange={(e) =>
            setForm((f) => ({ ...f, state: e.target.value as ServerState }))
          }
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
        >
          {STATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tags
        </p>
        <TagPicker
          available={SERVER_TAGS}
          selected={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-server-long"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Long Description
        </label>
        <textarea
          id="edit-server-long"
          rows={8}
          value={form.long}
          onChange={(e) => setForm((f) => ({ ...f, long: e.target.value }))}
          className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          required
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Extra Links
        </p>
        <LinksEditor links={links} onChange={setLinks} />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={form.nsfw}
          onChange={(e) => setForm((f) => ({ ...f, nsfw: e.target.checked }))}
          className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          This server contains NSFW content
        </span>
      </label>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={form.loginRequiredForInvite}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              loginRequiredForInvite: e.target.checked,
            }))
          }
          className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Require sign-in before showing the invite
        </span>
      </label>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={form.captchaOptOut}
          onChange={(e) =>
            setForm((f) => ({ ...f, captchaOptOut: e.target.checked }))
          }
          className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Opt out of captchas for this server
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={form.showEmojis}
          onChange={(e) =>
            setForm((f) => ({ ...f, showEmojis: e.target.checked }))
          }
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Show this server's emojis &amp; stickers on its listing page
          <span className="block text-xs text-zinc-400 dark:text-zinc-600">
            Synced periodically while the tracking bot is a member of your
            server. Nothing shows if it isn't.
          </span>
        </span>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

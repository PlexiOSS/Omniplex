"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { servers } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { SERVER_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";

export default function AddServerPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm] = useState({
    server_id: "",
    short: "",
    long: "",
    invite: "",
    nsfw: false,
    tags: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isAuthenticated || !session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.server_id.trim()) {
      setError("Server ID is required.");
      return;
    }
    if (!form.short.trim()) {
      setError("Short description is required.");
      return;
    }
    if (!form.invite.trim()) {
      setError("Invite URL is required.");
      return;
    }

    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      const extra_links = [{ name: "invite", value: form.invite.trim() }];
      const server = await servers.createServer(
        {
          server_id: form.server_id.trim(),
          short: form.short.trim(),
          long: form.long.trim() || undefined,
          nsfw: form.nsfw,
          tags: form.tags,
          extra_links,
        },
        session.token,
      );
      router.push(`/servers/${server.vanity || server.server_id}`);
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

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Add a Server
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            List your Discord server. Enable Developer Mode in Discord (Settings
            → Advanced) then right-click your server icon to copy the Server ID.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Server ID */}
          <Input
            id="server_id"
            label="Server ID"
            placeholder="123456789012345678"
            value={form.server_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, server_id: e.target.value }))
            }
            required
          />

          {/* Short description */}
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
              maxLength={191}
              value={form.short}
              onChange={(e) =>
                setForm((f) => ({ ...f, short: e.target.value }))
              }
              placeholder="What's your server about?"
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
            />
            <p className="text-right text-xs text-zinc-400">
              {form.short.length}/191
            </p>
          </div>

          {/* Invite URL */}
          <Input
            id="invite"
            label="Invite URL"
            type="url"
            placeholder="https://discord.gg/yourserver"
            value={form.invite}
            onChange={(e) => setForm((f) => ({ ...f, invite: e.target.value }))}
            required
          />

          {/* Tags */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags
            </p>
            <TagPicker
              available={AVAILABLE_TAGS}
              selected={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            />
          </div>

          {/* Long description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="long"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Long Description{" "}
              <span className="text-xs text-zinc-400">(HTML supported)</span>
            </label>
            <textarea
              id="long"
              rows={8}
              value={form.long}
              onChange={(e) => setForm((f) => ({ ...f, long: e.target.value }))}
              placeholder="Tell people what makes your server special — community, events, rules…"
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
          </div>

          {/* NSFW */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.nsfw}
              onChange={(e) =>
                setForm((f) => ({ ...f, nsfw: e.target.checked }))
              }
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              This server contains NSFW content
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
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
      </div>
    </Container>
  );
}

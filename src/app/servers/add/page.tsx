"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { servers } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link as ApiLink } from "@/lib/api/types";
import { SERVER_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";

const LONG_MIN = 500;
const SHORT_MIN = 30;
const SHORT_MAX = 150;

export default function AddServerPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm] = useState({
    invite: "",
    short: "",
    long: "",
    nsfw: false,
    tags: [] as string[],
  });
  const [links, setLinks] = useState<ApiLink[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isAuthenticated || !session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.invite.trim()) return setError("Invite URL is required.");
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
      ...links.filter((l) => l.name.trim() && l.value.trim()),
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
        },
        session.token,
      );
      router.push("/dashboard");
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="invite"
            label="Invite URL"
            type="url"
            placeholder="https://discord.gg/yourserver"
            value={form.invite}
            onChange={(e) => setForm((f) => ({ ...f, invite: e.target.value }))}
            required
          />

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
              onChange={(e) => setForm((f) => ({ ...f, long: e.target.value }))}
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
            <LinksEditor links={links} onChange={setLinks} />
          </div>

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
      </div>
    </Container>
  );
}

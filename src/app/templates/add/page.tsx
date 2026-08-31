"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { serverTemplates } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { SERVER_TAGS } from "@/lib/constants/tags";

export default function AddServerTemplatePage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm] = useState({
    code: "",
    short: "",
    tags: [] as string[],
    nsfw: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isAuthenticated || !session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (!form.code.trim()) return setError("Template code is required.");
    if (!form.short.trim()) return setError("A description is required.");
    if (form.tags.length === 0) return setError("Pick at least one tag.");

    setSubmitting(true);
    setError(null);

    try {
      const res = await serverTemplates.create(
        session.user_id,
        {
          code: form.code.trim(),
          short: form.short.trim(),
          tags: form.tags,
          nsfw: form.nsfw,
        },
        session.token,
      );
      router.push(`/templates?created=${res.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit template. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Submit a Server Template
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Share a Discord server template -- a one-click starting point with
            channels, roles, and permissions already set up. The template's name
            is pulled straight from Discord, so it has to already exist there
            first.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <Input
              id="code"
              label="Template Code"
              placeholder="2TffvyCfd8n7"
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.trim() }))
              }
              required
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              The part after{" "}
              <span className="font-mono">discord.com/template/</span> when you
              share a template from Server Settings.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="short"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="short"
              rows={3}
              maxLength={150}
              value={form.short}
              onChange={(e) =>
                setForm((f) => ({ ...f, short: e.target.value }))
              }
              placeholder="What kind of server is this template for?"
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
            />
            <p className="text-right text-xs text-zinc-400">
              {form.short.length}/150
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags <span className="text-red-500">*</span>
            </p>
            <TagPicker
              available={SERVER_TAGS}
              selected={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            />
          </div>

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
              This template is for an NSFW-oriented server
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
            Submit Template
          </Button>
        </form>
      </div>
    </Container>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { usePersistedFormDraft } from "@/hooks/usePersistedFormDraft";
import { teams } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Link as ApiLink } from "@/lib/api/types";
import { SERVER_TAGS as AVAILABLE_TAGS } from "@/lib/constants/tags";

const SHORT_MAX = 150;

interface CreateTeamDraft {
  name: string;
  short: string;
  tags: string[];
  links: ApiLink[];
  nsfw: boolean;
}

const DRAFT_DEFAULT: CreateTeamDraft = {
  name: "",
  short: "",
  tags: [],
  links: [],
  nsfw: false,
};

export default function AddTeamPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm, clearDraft] = usePersistedFormDraft<CreateTeamDraft>(
    "teams/add",
    session?.user_id,
    DRAFT_DEFAULT,
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isAuthenticated || !session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await teams.createTeam(
        {
          name: form.name.trim(),
          short: form.short.trim() || undefined,
          tags: form.tags,
          extra_links: form.links.filter(
            (l) => l.name.trim() && l.value.trim(),
          ),
          nsfw: form.nsfw,
        },
        session.token,
      );
      clearDraft();
      router.push(`/teams/${res.team_id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create team.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Create a Team
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Teams own bots and servers on behalf of a group instead of a
            single person, with per-member permissions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="name"
            label="Team Name"
            placeholder="My Cool Team"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="short"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Short Description
            </label>
            <textarea
              id="short"
              rows={2}
              maxLength={SHORT_MAX}
              value={form.short}
              onChange={(e) =>
                setForm((f) => ({ ...f, short: e.target.value }))
              }
              placeholder="What's this team about?"
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
            <p className="text-xs text-right text-zinc-400">
              {form.short.length}/{SHORT_MAX}
            </p>
          </div>

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

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Extra Links
            </p>
            <LinksEditor
              links={form.links}
              onChange={(links) => setForm((f) => ({ ...f, links }))}
            />
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
              This team's content is NSFW
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
            Create Team
          </Button>
        </form>
      </div>
    </Container>
  );
}

"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FieldLabel,
  FormChecklist,
  FormError,
  FormLayout,
  FormSection,
  NsfwToggle,
  TEXTAREA_CLASS,
} from "@/components/forms/FormSection";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
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
      <PageHeader
        icon={Users}
        title="Create a Team"
        description="Teams own bots and servers on behalf of a group, with permissions for each member."
      />

      <form onSubmit={handleSubmit}>
        <FormLayout
          aside={
            <>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Preview
                </p>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-base font-semibold text-accent ring-1 ring-accent/15">
                      {(form.name.trim()[0] ?? "T").toUpperCase()}
                    </span>
                    <p className="min-w-0 truncate font-semibold text-zinc-950 dark:text-zinc-50">
                      {form.name.trim() || "Your team name"}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                    {form.short.trim() || "What's this team about?"}
                  </p>
                  {form.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {form.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <FormChecklist
                title="After you create it"
                numbered
                items={[
                  "Invite members and choose what each one can do.",
                  "Pick this team as the owner when you add a bot or server.",
                  "Move existing bots and servers to it from your dashboard.",
                ]}
              />

              {error && <FormError>{error}</FormError>}

              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                size="lg"
                className="w-full"
              >
                Create Team
              </Button>
            </>
          }
        >
          <FormSection
            step={1}
            title="Basics"
            description="How your team shows up on its page and on listings it owns."
          >
            <div className="space-y-4">
              <Input
                id="name"
                label="Team Name"
                placeholder="My Cool Team"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
              <div>
                <FieldLabel
                  htmlFor="short"
                  count={`${form.short.length}/${SHORT_MAX}`}
                >
                  Short Description
                </FieldLabel>
                <textarea
                  id="short"
                  rows={2}
                  maxLength={SHORT_MAX}
                  value={form.short}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, short: e.target.value }))
                  }
                  placeholder="What's this team about?"
                  className={`resize-none ${TEXTAREA_CLASS}`}
                />
              </div>
            </div>
          </FormSection>

          <FormSection step={2} title="Tags" description="Optional.">
            <TagPicker
              available={AVAILABLE_TAGS}
              selected={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            />
          </FormSection>

          <FormSection
            step={3}
            title="Links"
            description="Website, support server or socials."
          >
            <div className="space-y-5">
              <LinksEditor
                links={form.links}
                onChange={(links) => setForm((f) => ({ ...f, links }))}
              />
              <NsfwToggle
                checked={form.nsfw}
                onChange={(nsfw) => setForm((f) => ({ ...f, nsfw }))}
                label="This team's content is NSFW."
              />
            </div>
          </FormSection>
        </FormLayout>
      </form>
    </Container>
  );
}

"use client";

import { LayoutTemplate } from "lucide-react";
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
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { serverTemplates } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { SERVER_TAGS } from "@/lib/constants/tags";

function templateCode(input: string) {
  return input
    .trim()
    .replace(
      /^(https?:\/\/)?(www\.)?(discord\.new|discord(app)?\.com\/template)\//i,
      "",
    )
    .replace(/[/?#].*$/, "");
}

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
    const code = templateCode(form.code);
    if (!code) return setError("Template code is required.");
    if (!/^[A-Za-z0-9]+$/.test(code))
      return setError(
        "That doesn't look like a template code. Paste the link or just the part after discord.new/.",
      );
    if (!form.short.trim()) return setError("A description is required.");
    if (form.tags.length === 0) return setError("Pick at least one tag.");

    setSubmitting(true);
    setError(null);

    try {
      const res = await serverTemplates.create(
        session.user_id,
        {
          code,
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
      <PageHeader
        icon={LayoutTemplate}
        title="Submit a Server Template"
        description="Share a one-click starting point with channels, roles and permissions already set up."
      />

      <form onSubmit={handleSubmit}>
        <FormLayout
          aside={
            <>
              <FormChecklist
                title="Getting a template code"
                numbered
                items={[
                  "Open Server Settings in the server you want to share.",
                  "Go to Server Template and create one (or sync an existing one).",
                  "Copy the link. The code is the part after discord.new/ or discord.com/template/.",
                ]}
              />
              <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">
                The template's name comes straight from Discord, so it has to
                exist there first.
              </p>

              {error && <FormError>{error}</FormError>}

              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                size="lg"
                className="w-full"
              >
                Submit Template
              </Button>
            </>
          }
        >
          <FormSection
            step={1}
            title="Template"
            description="The code from your Discord template link."
          >
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
          </FormSection>

          <FormSection
            step={2}
            title="Details"
            description="Help people decide if it fits their server."
          >
            <div className="space-y-5">
              <div>
                <FieldLabel
                  htmlFor="short"
                  required
                  count={`${form.short.length}/150`}
                >
                  Description
                </FieldLabel>
                <textarea
                  id="short"
                  rows={3}
                  maxLength={150}
                  value={form.short}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, short: e.target.value }))
                  }
                  placeholder="What kind of server is this template for?"
                  className={`resize-none ${TEXTAREA_CLASS}`}
                  required
                />
              </div>

              <div>
                <FieldLabel required>Tags</FieldLabel>
                <TagPicker
                  available={SERVER_TAGS}
                  selected={form.tags}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                />
              </div>

              <NsfwToggle
                checked={form.nsfw}
                onChange={(nsfw) => setForm((f) => ({ ...f, nsfw }))}
                label="This template is for an NSFW-oriented server."
              />
            </div>
          </FormSection>
        </FormLayout>
      </form>
    </Container>
  );
}

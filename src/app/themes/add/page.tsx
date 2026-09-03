"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ColorInput } from "@/components/ui/ColorInput";
import { Input } from "@/components/ui/Input";
import { TagPicker } from "@/components/ui/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { themes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { THEME_CATEGORIES } from "@/lib/constants/tags";

export default function AddThemePage() {
  const router = useRouter();
  const { session, isAuthenticated, loading } = useAuth();
  const { me, loading: meLoading } = useMe(session);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [form, setForm] = useState({
    name: "",
    primaryColor: "",
    secondaryColor: "",
    tags: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || meLoading || !isAuthenticated || !session || !me) return null;

  const HEX6_PATTERN = /^#[0-9a-fA-F]{6}$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!HEX6_PATTERN.test(form.primaryColor)) {
      setError("Primary color must be a 6-digit hex code, e.g. #5865F2.");
      return;
    }
    if (!HEX6_PATTERN.test(form.secondaryColor)) {
      setError("Secondary color must be a 6-digit hex code, e.g. #5865F2.");
      return;
    }
    if (form.tags.length === 0) {
      setError("Pick at least one category.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await themes.create(
        session.user_id,
        {
          name: form.name.trim(),
          primary_color: form.primaryColor.toUpperCase(),
          secondary_color: form.secondaryColor.toUpperCase(),
          tags: form.tags,
        },
        session.token,
      );
      router.push(`/themes/${result.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit theme. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Submit a Theme
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A name plus two hex colors -- no file upload needed.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            id="theme-name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Sunset Vibes"
            maxLength={40}
            required
          />

          <ColorInput
            id="theme-primary"
            label="Primary Color"
            value={form.primaryColor}
            onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))}
            required
          />

          <ColorInput
            id="theme-secondary"
            label="Secondary Color"
            value={form.secondaryColor}
            onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))}
            required
          />

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Categories{" "}
              <span className="text-xs font-normal text-zinc-400">
                (up to 3)
              </span>
            </p>
            <TagPicker
              available={THEME_CATEGORIES}
              selected={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
              max={3}
            />
          </div>

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
            Submit Theme
          </Button>
        </form>
      </div>
    </Container>
  );
}

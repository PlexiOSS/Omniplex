"use client";

import { Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FormError,
  FormLayout,
  FormSection,
} from "@/components/forms/FormSection";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThemePreviewCard } from "@/components/themes/ThemePreviewCard";
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

  const previewPrimary = HEX6_PATTERN.test(form.primaryColor)
    ? form.primaryColor
    : "#5865F2";
  const previewSecondary = HEX6_PATTERN.test(form.secondaryColor)
    ? form.secondaryColor
    : "#EB459E";

  return (
    <Container className="py-10">
      <PageHeader
        icon={Palette}
        title="Submit a Theme"
        description="A Discord profile theme is just a name and two colors. No file upload needed."
      />

      <form onSubmit={handleSubmit}>
        <FormLayout
          aside={
            <>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Preview
                </p>
                {me.user ? (
                  <ThemePreviewCard
                    themeName={form.name.trim() || "Your theme"}
                    tags={form.tags}
                    primaryColor={previewPrimary}
                    secondaryColor={previewSecondary}
                    owner={me.user}
                    compact
                  />
                ) : (
                  <div
                    className="h-48 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${previewPrimary}, ${previewSecondary})`,
                    }}
                  />
                )}
              </div>

              {error && <FormError>{error}</FormError>}

              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                size="lg"
                className="w-full"
              >
                Submit Theme
              </Button>
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                The preview uses your own profile.
              </p>
            </>
          }
        >
          <FormSection
            step={1}
            title="Name"
            description="What people see in the theme gallery."
          >
            <Input
              id="theme-name"
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Sunset Vibes"
              maxLength={40}
              required
            />
          </FormSection>

          <FormSection
            step={2}
            title="Colors"
            description="The two colors of the profile gradient, as 6-digit hex codes."
          >
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <div
              className="mt-4 h-3 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${previewPrimary}, ${previewSecondary})`,
              }}
            />
          </FormSection>

          <FormSection
            step={3}
            title="Categories"
            description="Pick up to 3 so people can find it."
          >
            <TagPicker
              available={THEME_CATEGORIES}
              selected={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
              max={3}
            />
          </FormSection>
        </FormLayout>
      </form>
    </Container>
  );
}

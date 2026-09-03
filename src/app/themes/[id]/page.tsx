import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { CopyColorButton } from "@/components/themes/CopyColorButton";
import { ThemePreviewCard } from "@/components/themes/ThemePreviewCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { themes } from "@/lib/api";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatRelativeTime } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const theme = await themes.getById(id).catch(() => null);
  if (!theme) return {};
  return {
    title: theme.name,
    description: `A Discord profile theme (${theme.primary_color} / ${theme.secondary_color}) on Omniplex.`,
  };
}

export default async function ThemePage({ params }: Props) {
  const { id } = await params;
  let theme = null;
  try {
    theme = await themes.getById(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    notFound();
  }
  if (!theme) notFound();

  return (
    <Container className="py-10">
      <Link
        href="/themes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All Themes
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <ThemePreviewCard
              primaryColor={theme.primary_color}
              secondaryColor={theme.secondary_color}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {theme.name}
            </h1>
          </div>

          {theme.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {theme.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-2">
            <CopyColorButton
              label="Primary Color"
              color={theme.primary_color}
            />
            <CopyColorButton
              label="Secondary Color"
              color={theme.secondary_color}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Submitted
                </span>
                <span className="font-medium text-zinc-950 dark:text-zinc-50">
                  {formatRelativeTime(theme.created_at)}
                </span>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Submitted by
            </h3>
            <Link
              href={`/user/${theme.owner.id}`}
              className="flex items-center gap-2.5"
            >
              <Avatar
                src={theme.owner.avatar}
                alt={theme.owner.username}
                size={32}
              />
              <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                {theme.owner.display_name || theme.owner.username}
              </span>
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}

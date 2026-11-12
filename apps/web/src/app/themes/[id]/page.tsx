import { themes } from "@omniplex/core/api";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { ArrowLeft, CalendarDays, Palette, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { CopyColorButton } from "@/components/themes/CopyColorButton";
import { ThemeOwnerActions } from "@/components/themes/ThemeOwnerActions";
import { ThemePreviewCard } from "@/components/themes/ThemePreviewCard";
import { StatRow } from "@/components/ui/StatRow";
import { isApiUnavailable, isNotFoundError } from "@/lib/utils/errors";

interface Props {
  params: Promise<{ id: string }>;
}

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
const cardTitle = "mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50";

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
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!theme) notFound();

  const more = await themes
    .getAll(1, theme.owner.id)
    .then((res) => res.results.filter((t) => t.id !== theme.id).slice(0, 3))
    .catch(() => []);

  const ownerName = theme.owner.display_name || theme.owner.username;
  const gradient = `linear-gradient(120deg, ${theme.primary_color}, ${theme.secondary_color})`;

  return (
    <Container className="py-10">
      <Link
        href="/themes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All themes
      </Link>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-24 sm:h-28" style={{ background: gradient }} />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 inline-block rounded-[1.25rem] bg-white p-1 dark:bg-zinc-900">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl text-white"
              style={{ background: gradient }}
            >
              <Palette size={32} className="drop-shadow" />
            </div>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere sm:text-3xl dark:text-zinc-50">
            {theme.name}
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            A Discord profile theme by {ownerName}.
          </p>
          {theme.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {theme.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section className={card}>
            <h2 className={cardTitle}>Preview</h2>
            <div className="flex justify-center rounded-xl bg-zinc-50 bg-[radial-gradient(var(--color-zinc-200)_1px,transparent_1px)] [background-size:16px_16px] p-6 sm:p-10 dark:bg-zinc-950 dark:bg-[radial-gradient(var(--color-zinc-800)_1px,transparent_1px)]">
              <div className="w-full max-w-sm">
                <ThemePreviewCard
                  themeName={theme.name}
                  tags={theme.tags}
                  primaryColor={theme.primary_color}
                  secondaryColor={theme.secondary_color}
                  owner={theme.owner}
                />
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Use it on Discord</h2>
            <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
              {[
                "Open User Settings in Discord, then Profiles.",
                "Under Profile Theme, set Primary and Accent to the colours on this page. Use the copy buttons to grab them.",
                "Save your changes. Profile themes need Discord Nitro.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {more.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  More from {ownerName}
                </h2>
                <Link
                  href={`/user/${theme.owner.id}`}
                  className="text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
                >
                  View profile
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {more.map((t) => (
                  <Link
                    key={t.id}
                    href={`/themes/${t.id}`}
                    title={t.name}
                    className="block rounded-2xl transition-transform hover:scale-[1.02]"
                  >
                    <ThemePreviewCard
                      themeName={t.name}
                      tags={t.tags}
                      primaryColor={t.primary_color}
                      secondaryColor={t.secondary_color}
                      owner={t.owner}
                      compact
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className={card}>
            <h3 className={cardTitle}>Colours</h3>
            <div className="space-y-2">
              <CopyColorButton label="Primary" color={theme.primary_color} />
              <CopyColorButton label="Accent" color={theme.secondary_color} />
            </div>
          </div>

          <div className={card}>
            <h3 className={cardTitle}>Details</h3>
            <dl className="space-y-2.5">
              <StatRow
                icon={<CalendarDays size={14} />}
                label="Submitted"
                value={formatRelativeTime(theme.created_at)}
              />
              <StatRow
                icon={<Tag size={14} />}
                label="Tags"
                value={theme.tags.length ? theme.tags.join(", ") : "None"}
              />
            </dl>
          </div>

          <Link
            href={`/user/${theme.owner.id}`}
            className={`${card} group flex items-center gap-3`}
          >
            <Avatar
              src={mirroredAvatarUrl(
                "users",
                theme.owner.id,
                theme.owner.avatar,
              )}
              alt={theme.owner.username}
              size={36}
            />
            <span className="min-w-0 text-sm">
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                Submitted by
              </span>
              <span className="block truncate font-medium text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                {ownerName}
              </span>
            </span>
          </Link>

          <ThemeOwnerActions ownerId={theme.owner.id} />
        </aside>
      </div>
    </Container>
  );
}

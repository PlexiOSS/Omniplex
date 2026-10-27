import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { CopyColorButton } from "@/components/themes/CopyColorButton";
import { ThemePreviewCard } from "@/components/themes/ThemePreviewCard";
import { Avatar } from "@/components/ui/Avatar";
import { themes } from "@/lib/api";
import { isApiUnavailable, isNotFoundError } from "@/lib/utils/errors";
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
    if (isNotFoundError(err)) notFound();
    throw err;
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

      <section className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 bg-zinc-50 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] p-6 sm:p-8 lg:border-r lg:border-b-0 dark:border-zinc-800 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]">
          <ThemePreviewCard
            themeName={theme.name}
            tags={theme.tags}
            primaryColor={theme.primary_color}
            secondaryColor={theme.secondary_color}
            owner={theme.owner}
          />
        </div>

        <div className="flex min-w-0 flex-col p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere sm:text-3xl dark:text-zinc-50">
            {theme.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/user/${theme.owner.id}`}
              className="inline-flex min-w-0 items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Avatar
                src={theme.owner.avatar}
                alt={theme.owner.username}
                size={20}
              />
              <span className="truncate">
                by {theme.owner.display_name || theme.owner.username}
              </span>
            </Link>
            <span>Submitted {formatRelativeTime(theme.created_at)}</span>
          </div>
          {theme.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {theme.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="mt-6 h-3 rounded-full ring-1 ring-black/5 dark:ring-white/10"
            style={{
              background: `linear-gradient(90deg, ${theme.primary_color}, ${theme.secondary_color})`,
            }}
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <CopyColorButton label="Primary" color={theme.primary_color} />
            <CopyColorButton label="Secondary" color={theme.secondary_color} />
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="font-medium text-zinc-950 dark:text-zinc-50">
              Use it on Discord
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
              <li>Open User Settings, then Profiles.</li>
              <li>
                Under Profile Theme, set Primary and Accent to these colors.
              </li>
              <li>Save. Profile themes need Discord Nitro.</li>
            </ol>
          </div>
        </div>
      </section>
    </Container>
  );
}

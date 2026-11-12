import { reviews, serverTemplates } from "@omniplex/core/api";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { formatCount, formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import {
  ArrowLeft,
  CalendarDays,
  Hash,
  RefreshCw,
  ShieldCheck,
  ThumbsUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { TemplateIcon } from "@/components/templates/TemplateIcon";
import { StatRow } from "@/components/ui/StatRow";
import { isApiUnavailable, isNotFoundError } from "@/lib/utils/errors";
import { TemplateChannels, TemplateRoles } from "./TemplateContents";
import { TemplateDetailActions } from "./TemplateDetailActions";
import { TemplateReactionButtons } from "./TemplateReactionButtons";

interface Props {
  params: Promise<{ id: string }>;
}

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
const cardTitle = "mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const template = await serverTemplates.getTemplate(id).catch(() => null);
  if (!template) return {};
  return {
    title: template.name,
    description: template.short,
    robots: template.unavailable ? { index: false } : undefined,
  };
}

export default async function TemplatePage({ params }: Props) {
  const { id } = await params;
  let template = null;
  try {
    template = await serverTemplates.getTemplate(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!template) notFound();

  const reviewList = await reviews
    .getAll("server_template", template.id)
    .catch(() => ({ reviews: [] }));

  const ownerName = template.owner.display_name || template.owner.username;

  const actionsCard = (
    <div className={card}>
      <div className="flex flex-col gap-3">
        <TemplateDetailActions
          templateId={template.id}
          code={template.code}
          ownerId={template.owner.id}
          unavailable={template.unavailable}
        />
        <TemplateReactionButtons
          templateId={template.id}
          initialLikes={template.likes}
          initialDislikes={template.dislikes}
        />
      </div>
    </div>
  );

  return (
    <Container className="py-10">
      <Link
        href="/templates"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All templates
      </Link>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-24 bg-linear-to-br from-accent/30 via-accent/10 to-transparent sm:h-28 dark:from-accent/25 dark:via-accent/10" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 inline-block rounded-[1.25rem] bg-white p-1 dark:bg-zinc-900">
            <TemplateIcon
              templateId={template.id}
              version={template.icon_version}
              name={template.name}
              size={80}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere sm:text-3xl dark:text-zinc-50">
              {template.name}
            </h1>
            {template.nsfw && <Badge variant="danger">NSFW</Badge>}
          </div>
          <p className="mt-1 max-w-2xl text-zinc-500 dark:text-zinc-400">
            {template.short}
          </p>
          {template.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/templates?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {template.unavailable && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            This template was deleted on Discord, so it can&apos;t be used right
            now. It&apos;s hidden from the templates list until its owner brings
            it back.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <div className="lg:hidden">{actionsCard}</div>

          <div className="grid gap-6 xl:grid-cols-2">
            <TemplateChannels channels={template.channels} />
            <TemplateRoles roles={template.roles} />
          </div>

          <section>
            <ReviewsSection
              targetType="server_template"
              targetId={template.id}
              initialReviews={reviewList.reviews}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">{actionsCard}</div>

          <div className={card}>
            <h3 className={cardTitle}>Stats</h3>
            <dl className="space-y-2.5">
              <StatRow
                icon={<Users size={14} />}
                label="Used on Discord"
                value={formatCount(template.usage_count)}
              />
              <StatRow
                icon={<Hash size={14} />}
                label="Channels"
                value={String(template.channel_count)}
              />
              <StatRow
                icon={<ShieldCheck size={14} />}
                label="Roles"
                value={String(template.role_count)}
              />
              <StatRow
                icon={<ThumbsUp size={14} />}
                label="Likes"
                value={formatCount(template.likes)}
              />
              <StatRow
                icon={<CalendarDays size={14} />}
                label="Submitted"
                value={formatRelativeTime(template.created_at)}
              />
              {template.synced_at && (
                <StatRow
                  icon={<RefreshCw size={14} />}
                  label="Checked"
                  value={formatRelativeTime(template.synced_at)}
                />
              )}
            </dl>
          </div>

          <Link
            href={`/user/${template.owner.id}`}
            className={`${card} group flex items-center gap-3`}
          >
            <Avatar
              src={mirroredAvatarUrl(
                "users",
                template.owner.id,
                template.owner.avatar,
              )}
              alt={template.owner.username}
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
        </aside>
      </div>
    </Container>
  );
}

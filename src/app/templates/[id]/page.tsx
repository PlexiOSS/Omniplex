import { ArrowLeft, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { reviews, serverTemplates } from "@/lib/api";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { TemplateContents } from "./TemplateContents";
import { TemplateDetailActions } from "./TemplateDetailActions";
import { TemplateReactionButtons } from "./TemplateReactionButtons";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // No dedicated /seo endpoint for templates -- the full fetch is already
  // light (no long-description/resolved-list fields to avoid), unlike
  // bots/servers/packs where that's worth a separate lightweight route.
  const template = await serverTemplates.getTemplate(id).catch(() => null);
  if (!template) return {};
  return {
    title: template.name,
    description: template.short,
  };
}

export default async function TemplatePage({ params }: Props) {
  const { id } = await params;
  let template = null;
  try {
    template = await serverTemplates.getTemplate(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    notFound();
  }
  if (!template) notFound();

  const reviewList = await reviews
    .getAll("server_template", template.id)
    .catch(() => ({ reviews: [] }));

  const actionsCard = (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-2">
        <TemplateDetailActions
          templateId={template.id}
          code={template.code}
          ownerId={template.owner.id}
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
        All Templates
      </Link>

      <Banner
        src={null}
        alt={template.name}
        className="mb-6 -mt-2 h-40 rounded-2xl sm:h-52"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Layers size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {template.name}
              </h1>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {template.short}
              </p>
            </div>
          </div>

          {template.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {template.nsfw && <Badge variant="danger">NSFW</Badge>}
              {template.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          {/* Actions (mobile only — desktop version lives in the sidebar) */}
          <div className="mt-5 lg:hidden">{actionsCard}</div>

          <TemplateContents
            channels={template.channels}
            roles={template.roles}
          />

          <section className="mt-12">
            <ReviewsSection
              targetType="server_template"
              targetId={template.id}
              initialReviews={reviewList.reviews}
            />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions (desktop only — mobile version renders above) */}
          <div className="hidden lg:block">{actionsCard}</div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <StatRow
                label="Used on Discord"
                value={`${formatCount(template.usage_count)} times`}
              />
              <StatRow
                label="Submitted"
                value={formatRelativeTime(template.created_at)}
              />
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Submitted by
            </h3>
            <Link
              href={`/user/${template.owner.id}`}
              className="flex items-center gap-2.5"
            >
              <Avatar
                src={template.owner.avatar}
                alt={template.owner.username}
                size={32}
              />
              <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                {template.owner.display_name || template.owner.username}
              </span>
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}

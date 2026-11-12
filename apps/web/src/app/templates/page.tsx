import { serverTemplates } from "@omniplex/core/api";
import type { PagedResult, ServerTemplate } from "@omniplex/core/api/types";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { Button } from "@omniplex/ui/Button";
import { LayoutTemplate, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { UrlPagination } from "@/components/browse/UrlPagination";
import { ServerTemplateCard } from "@/components/cards/ServerTemplateCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SERVER_TAGS } from "@/lib/constants/tags";
import { isApiUnavailable } from "@/lib/utils/errors";

export const metadata: Metadata = {
  title: "Server Templates",
  alternates: { canonical: "/templates" },
};

interface Props {
  searchParams: Promise<{ tag?: string; page?: string }>;
}

function chipClass(active: boolean) {
  return [
    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "bg-accent/10 text-accent"
      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
  ].join(" ");
}

export default async function ServerTemplatesPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeTag =
    params.tag && SERVER_TAGS.includes(params.tag) ? params.tag : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  let data: PagedResult<ServerTemplate[]>;
  try {
    data = await serverTemplates.getAll(
      page,
      activeTag ? [activeTag] : undefined,
    );
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
    throw err;
  }

  const templates = data.results;

  return (
    <Container className="py-10">
      <PageHeader
        icon={LayoutTemplate}
        title="Server Templates"
        description={
          <>
            Ready-made Discord servers: channels, roles and permissions you can
            copy into a new server in one click.{" "}
            {formatCountLabel(data.count, "template")}
            {activeTag ? ` tagged ${activeTag}.` : " so far."}
          </>
        }
        actions={
          <Link href="/templates/add">
            <Button variant="primary" size="sm">
              <Plus size={14} />
              Submit a template
            </Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        <Link
          href="/templates"
          scroll={false}
          className={chipClass(!activeTag)}
        >
          All
        </Link>
        {SERVER_TAGS.map((t) => (
          <Link
            key={t}
            href={`/templates?tag=${encodeURIComponent(t)}`}
            scroll={false}
            className={chipClass(activeTag === t)}
          >
            {t}
          </Link>
        ))}
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title={activeTag ? "No templates with this tag" : "No templates yet"}
        >
          {activeTag ? (
            <Link href="/templates" className="text-accent hover:underline">
              Show every template
            </Link>
          ) : (
            <Link href="/templates/add" className="text-accent hover:underline">
              Submit the first one
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <ServerTemplateCard key={template.id} template={template} />
            ))}
          </div>
          {data.count > data.per_page && (
            <div className="mt-10">
              <UrlPagination
                page={page}
                total={data.count}
                perPage={data.per_page}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}

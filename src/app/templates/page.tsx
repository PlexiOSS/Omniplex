import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Button } from "@/components/ui/Button";
import { serverTemplates } from "@/lib/api";
import { SERVER_TAGS } from "@/lib/constants/tags";
import { isApiUnavailable } from "@/lib/utils/errors";
import { TemplateGrid } from "./TemplateGrid";

export const metadata: Metadata = { title: "Server Templates" };

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

export default async function ServerTemplatesPage({ searchParams }: Props) {
  const { tag } = await searchParams;
  const activeTag = tag && SERVER_TAGS.includes(tag) ? tag : undefined;

  let data = null;
  try {
    data = await serverTemplates.getAll(1, activeTag ? [activeTag] : undefined);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
  }

  const templates = data?.results ?? [];

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Server Templates
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            One-click Discord server templates -- channels, roles, and
            permissions, ready to clone into your own server.
          </p>
        </div>
        <Link href="/templates/add">
          <Button variant="primary" size="sm">
            <Plus size={14} />
            Submit a Template
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        <Link
          href="/templates"
          className={[
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            !activeTag
              ? "bg-accent/10 text-accent"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
          ].join(" ")}
        >
          All
        </Link>
        {SERVER_TAGS.map((t) => (
          <Link
            key={t}
            href={`/templates?tag=${encodeURIComponent(t)}`}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTag === t
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {t}
          </Link>
        ))}
      </div>

      <TemplateGrid initialTemplates={templates} />
    </Container>
  );
}

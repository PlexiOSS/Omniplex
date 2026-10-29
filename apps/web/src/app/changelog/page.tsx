import { Megaphone, Rss } from "lucide-react";
import type { Metadata } from "next";
import { ChangelogList } from "@/components/changelog/ChangelogList";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { changelogs } from "@/lib/api";
import type { ChangelogProject } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Curated release notes for Popplio, Omniplex, and Keel.",
  alternates: {
    types: {
      "application/rss+xml": "/changelog/rss.xml",
    },
  },
};

const PROJECTS: ChangelogProject[] = ["popplio", "omniplex", "keel"];

interface Props {
  searchParams: Promise<{ project?: string }>;
}

export default async function ChangelogPage({ searchParams }: Props) {
  const { project } = await searchParams;
  const activeProject = PROJECTS.includes(project as ChangelogProject)
    ? (project as ChangelogProject)
    : null;

  let entries: Awaited<ReturnType<typeof changelogs.getAll>>["entries"];
  try {
    entries = (await changelogs.getAll()).entries;
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
    throw err;
  }

  return (
    <Container className="py-10">
      <PageHeader
        icon={Megaphone}
        title="Changelog"
        description="Curated release notes for Popplio, Omniplex and Keel."
        actions={
          <a
            href="/changelog/rss.xml"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <Rss size={14} />
            RSS
          </a>
        }
      />

      <ChangelogList entries={entries} activeProject={activeProject} />
    </Container>
  );
}

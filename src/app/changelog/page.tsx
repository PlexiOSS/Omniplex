import { Rss } from "lucide-react";
import type { Metadata } from "next";
import { ChangelogList } from "@/components/changelog/ChangelogList";
import { Container } from "@/components/layout/Container";
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
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Changelog
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Curated release notes for Popplio, Omniplex, and Keel.
          </p>
        </div>
        <a
          href="/changelog/rss.xml"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-400"
        >
          <Rss size={12} />
          RSS
        </a>
      </div>

      <ChangelogList entries={entries} activeProject={activeProject} />
    </Container>
  );
}

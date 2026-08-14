import { Rss } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ChangelogList } from "@/components/changelog/ChangelogList";
import { CHANGELOG_REPOS } from "@/lib/github/config";
import { getChangelogEntries } from "@/lib/github/releases";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release notes for Popplio and Omniplex, pulled from GitHub.",
  alternates: {
    types: {
      "application/rss+xml": "/changelog/rss.xml",
    },
  },
};

export default async function ChangelogPage() {
  const entries = await getChangelogEntries();

  return (
    <Container className="py-10">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Changelog
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Release notes for{" "}
            {CHANGELOG_REPOS.map((r) => r.label).join(" and ")}, pulled
            straight from GitHub.
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

      <ChangelogList entries={entries} repos={CHANGELOG_REPOS} />
    </Container>
  );
}

import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ChangelogList } from "@/components/changelog/ChangelogList";
import { CHANGELOG_REPOS } from "@/lib/github/config";
import { getChangelogEntries } from "@/lib/github/releases";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release notes for Popplio and Omniplex, pulled from GitHub.",
};

export default async function ChangelogPage() {
  const entries = await getChangelogEntries();

  return (
    <Container className="py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Changelog
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Release notes for {CHANGELOG_REPOS.map((r) => r.label).join(" and ")},
          pulled straight from GitHub.
        </p>
      </div>

      <ChangelogList entries={entries} repos={CHANGELOG_REPOS} />
    </Container>
  );
}

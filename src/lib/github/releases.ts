import { CHANGELOG_REPOS, type ChangelogRepo } from "./config";

export interface GithubRelease {
  id: number;
  html_url: string;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

/** A GithubRelease tagged with which configured repo it came from. */
export interface ChangelogEntry extends GithubRelease {
  source: ChangelogRepo;
}

// Optional — set on the server to raise GitHub's unauthenticated rate limit
// (60 req/hr per IP, shared across every visitor hitting this same server)
// up to 5000 req/hr. A public-repo read-only token is enough; never expose
// this as NEXT_PUBLIC_*.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

async function fetchReleases(source: ChangelogRepo): Promise<ChangelogEntry[]> {
  const res = await fetch(
    `https://api.github.com/repos/${source.owner}/${source.repo}/releases?per_page=30`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
      },
      // Releases are cut infrequently — a short revalidate window keeps the
      // page fast and avoids hammering GitHub's rate limit on every request,
      // without going as far as force-cache (which would need a deploy to
      // ever pick up a new release).
      next: { revalidate: 900 },
    },
  );

  if (!res.ok) {
    throw new Error(
      `GitHub releases fetch failed for ${source.owner}/${source.repo}: ${res.status}`,
    );
  }

  const releases = (await res.json()) as GithubRelease[];
  return releases
    .filter((r) => !r.draft)
    .map((r) => ({ ...r, source }));
}

/**
 * Fetches releases for every configured repo (see CHANGELOG_REPOS) and
 * merges them into one reverse-chronological timeline. A single repo's
 * fetch failing doesn't take down the whole page — it's just omitted.
 */
export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  const results = await Promise.allSettled(
    CHANGELOG_REPOS.map(fetchReleases),
  );

  const entries = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  return entries.sort((a, b) => {
    const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bDate - aDate;
  });
}

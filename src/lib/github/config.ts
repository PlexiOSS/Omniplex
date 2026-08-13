export interface ChangelogRepo {
  owner: string;
  repo: string;
  /** Display label shown as a badge on each release from this repo. */
  label: string;
}

/** Repos whose GitHub Releases feed the public /changelog page. Add more here to track additional repos — no other code changes needed. */
export const CHANGELOG_REPOS: ChangelogRepo[] = [
  { owner: "PlexiOSS", repo: "Popplio", label: "API" },
  { owner: "PlexiOSS", repo: "Orbiplex", label: "Website" },
];

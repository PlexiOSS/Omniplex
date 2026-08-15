export interface ChangelogRepo {
  owner: string;
  repo: string;
  label: string;
}

export const CHANGELOG_REPOS: ChangelogRepo[] = [
  { owner: "PlexiOSS", repo: "Popplio", label: "API" },
  { owner: "PlexiOSS", repo: "Orbiplex", label: "Website" },
];

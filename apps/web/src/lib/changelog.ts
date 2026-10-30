import type { ChangelogProject } from "@/lib/api/types";

export const CHANGELOG_PROJECTS: ChangelogProject[] = [
  "popplio",
  "omniplex",
  "keel",
];

export const PROJECT_LABEL: Record<ChangelogProject, string> = {
  popplio: "Popplio",
  omniplex: "Omniplex",
  keel: "Keel",
};

const PACKAGE_LABEL: Record<string, string> = {
  "sdk-js": "JavaScript SDK",
  "sdk-python": "Python SDK",
  "sdk-go": "Go SDK",
  "sdk-rust": "Rust SDK",
  "api-types": "API Types",
};

export function packageLabel(pkg: string): string {
  if (PACKAGE_LABEL[pkg]) return PACKAGE_LABEL[pkg];
  const lang = pkg.startsWith("sdk-") ? pkg.slice(4) : "";
  return lang ? `${lang[0].toUpperCase()}${lang.slice(1)} SDK` : pkg;
}

export function changelogLabel(project: string, pkg?: string | null): string {
  const name = PROJECT_LABEL[project as ChangelogProject] ?? project;
  return pkg ? `${name} ${packageLabel(pkg)}` : name;
}

export interface ChangelogTrack {
  project: ChangelogProject;
  package: string | null;
}

export function trackKey(entry: {
  project: string;
  package?: string | null;
}): string {
  return entry.package ? `${entry.project}:${entry.package}` : entry.project;
}

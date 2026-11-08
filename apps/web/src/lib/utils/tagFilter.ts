export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function tagAttr(tags: string[] | null | undefined): string | undefined {
  const slugs = (tags ?? []).map(tagSlug).filter(Boolean);
  return slugs.length > 0 ? slugs.join(" ") : undefined;
}

import { headingSlug } from "@/components/markdown/rehypeHeadingIds";

export interface OutlineHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function plainText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/[*_~`]/g, "")
    .trim();
}

export function markdownOutline(markdown: string): OutlineHeading[] {
  const out: OutlineHeading[] = [];
  const seen = new Map<string, number>();
  let fenced = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = plainText(match[2]);
    const base = headingSlug(text);
    if (!base) continue;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const level = match[1].length;
    if (level > 3) continue;
    out.push({
      id: count === 0 ? base : `${base}-${count}`,
      text,
      level: level as 2 | 3,
    });
  }

  return out;
}

export function readingMinutes(markdown: string): number {
  const words = plainText(markdown.replace(/```[\s\S]*?```/g, ""))
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

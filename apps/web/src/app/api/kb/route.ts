import { NextResponse } from "next/server";
import { KB_COMMON_QUESTIONS } from "@/lib/kb/categories";
import { getKbCategories } from "@/lib/kb/content";

export const dynamic = "force-static";

const SUMMARY_MAX = 420;

function plain(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function prose(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(#|[-*+] |>|\||\d+\.|```|<|:::)/.test(p))
    .map(plain);
}

function summary(content: string): string {
  const intro = prose(content.split(/^## /m)[0]);
  const paragraphs = intro.length > 0 ? intro : prose(content).slice(0, 1);

  let out = "";
  for (const p of paragraphs) {
    const next = out ? `${out} ${p}` : p;
    if (next.length > SUMMARY_MAX) break;
    out = next;
  }

  if (out) return out;
  const first = paragraphs[0] ?? "";
  const cut = first.slice(0, SUMMARY_MAX);
  const stop = cut.lastIndexOf(". ");
  return stop > 80 ? cut.slice(0, stop + 1) : cut;
}

function sections(content: string): string[] {
  return content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => plain(line.slice(3)));
}

export function GET() {
  const categories = getKbCategories();

  return NextResponse.json({
    categories: categories
      .filter((c) => c.articles.length > 0)
      .map(({ slug, title, description }) => ({ slug, title, description })),
    common: KB_COMMON_QUESTIONS.map((q) => `${q.category}/${q.slug}`),
    articles: categories.flatMap((c) =>
      c.articles.map((a) => ({
        slug: a.slug,
        category: c.slug,
        categoryTitle: c.title,
        title: a.title,
        description: a.description,
        summary: summary(a.content),
        sections: sections(a.content),
      })),
    ),
  });
}

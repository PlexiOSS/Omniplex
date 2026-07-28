import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { KB_CATEGORIES, type KbCategoryMeta } from "./categories";

const CONTENT_DIR = path.join(process.cwd(), "src/content/kb");

export interface KbArticle {
  slug: string;
  category: string;
  title: string;
  description: string;
  order: number;
  content: string;
}

export interface KbCategory extends KbCategoryMeta {
  articles: KbArticle[];
}

function readArticle(categorySlug: string, fileName: string): KbArticle {
  const filePath = path.join(CONTENT_DIR, categorySlug, fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug: fileName.replace(/\.md$/, ""),
    category: categorySlug,
    title: data.title,
    description: data.description ?? "",
    order: data.order ?? 0,
    content: content.trim(),
  };
}

/** Reads and parses every KB article from disk. Content is static and small, so no caching layer is needed. */
export function getKbCategories(): KbCategory[] {
  return [...KB_CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((category) => {
      const dir = path.join(CONTENT_DIR, category.slug);
      const files = fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => f.endsWith(".md"))
        : [];
      const articles = files
        .map((file) => readArticle(category.slug, file))
        .sort((a, b) => a.order - b.order);
      return { ...category, articles };
    });
}

export function getKbCategory(slug: string): KbCategory | undefined {
  return getKbCategories().find((c) => c.slug === slug);
}

export function getKbArticle(
  categorySlug: string,
  articleSlug: string,
): { category: KbCategory; article: KbArticle } | undefined {
  const category = getKbCategory(categorySlug);
  const article = category?.articles.find((a) => a.slug === articleSlug);
  if (!category || !article) return undefined;
  return { category, article };
}

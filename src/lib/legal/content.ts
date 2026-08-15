import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "src/content/legal");

export interface LegalDocument {
  slug: string;
  title: string;
  description: string;
  order: number;
  lastUpdated: string;
  content: string;
}

function readDocument(fileName: string): LegalDocument {
  const filePath = path.join(CONTENT_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug: fileName.replace(/\.md$/, ""),
    title: data.title,
    description: data.description ?? "",
    order: data.order ?? 0,
    lastUpdated: data.lastUpdated ?? "",
    content: content.trim(),
  };
}

export function getLegalDocuments(): LegalDocument[] {
  const files = fs.existsSync(CONTENT_DIR)
    ? fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"))
    : [];
  return files.map(readDocument).sort((a, b) => a.order - b.order);
}

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return getLegalDocuments().find((d) => d.slug === slug);
}

import Link from "next/link";
import type { KbCategory } from "@/lib/kb/content";
import { kbCategoryIcon } from "./kbIcons";

interface KbSidebarProps {
  categories: KbCategory[];
  activeCategory: string;
  activeSlug?: string;
}

export function KbSidebar({
  categories,
  activeCategory,
  activeSlug,
}: KbSidebarProps) {
  return (
    <nav className="space-y-1">
      {categories.map((category) => {
        const Icon = kbCategoryIcon(category.slug);
        const isOpen = category.slug === activeCategory;
        return (
          <div key={category.slug}>
            <Link
              href={`/kb/${category.slug}`}
              className={[
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                isOpen
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{category.title}</span>
            </Link>
            {isOpen && (
              <ul className="mt-1 mb-3 ml-4 space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
                {category.articles.map((article) => {
                  const isActive = article.slug === activeSlug;
                  return (
                    <li key={article.slug}>
                      <Link
                        href={`/kb/${category.slug}/${article.slug}`}
                        className={[
                          "-ml-px block border-l py-1 pl-3 text-sm transition-colors",
                          isActive
                            ? "border-accent font-medium text-accent"
                            : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                        ].join(" ")}
                      >
                        {article.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

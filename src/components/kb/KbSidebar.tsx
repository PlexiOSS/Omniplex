import Link from "next/link";
import type { KbCategory } from "@/lib/kb/content";

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
    <nav className="space-y-6">
      {categories.map((category) => (
        <div key={category.slug}>
          <Link
            href={`/kb/${category.slug}`}
            className={[
              "block text-sm font-semibold transition-colors",
              category.slug === activeCategory
                ? "text-accent"
                : "text-zinc-950 hover:text-accent dark:text-zinc-50",
            ].join(" ")}
          >
            {category.title}
          </Link>
          <ul className="mt-2 space-y-1 border-l border-zinc-200 dark:border-zinc-800">
            {category.articles.map((article) => {
              const isActive =
                category.slug === activeCategory && article.slug === activeSlug;
              return (
                <li key={article.slug}>
                  <Link
                    href={`/kb/${category.slug}/${article.slug}`}
                    className={[
                      "-ml-px block border-l pl-3 py-1 text-sm transition-colors",
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
        </div>
      ))}
    </nav>
  );
}

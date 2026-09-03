"use client";

import { Palette, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { ThemePreviewCard } from "@/components/themes/ThemePreviewCard";
import { themes } from "@/lib/api";

export default function ThemesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSWR(`themes/all/${page}`, () =>
    themes.getAll(page),
  );

  const results = data?.results ?? [];

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Themes
          </h1>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Two-color Discord profile theme combinations, submitted by the
            community. Click one to copy its colors.
          </p>
        </div>
        <Link
          href="/themes/add"
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          <Plus size={14} />
          Submit a Theme
        </Link>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Failed to load themes.</p>
        </div>
      ) : isLoading ? (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <Palette
            size={24}
            className="mb-2 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm">No themes have been submitted yet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((theme) => (
              <Link
                key={theme.id}
                href={`/themes/${theme.id}`}
                title={theme.name}
                className="group overflow-hidden rounded-2xl border border-zinc-200 transition-colors hover:border-accent/40 dark:border-zinc-800"
              >
                <ThemePreviewCard
                  primaryColor={theme.primary_color}
                  secondaryColor={theme.secondary_color}
                  compact
                />
                <div className="bg-white p-3 dark:bg-zinc-900">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {theme.name}
                  </p>
                  {theme.tags.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {theme.tags.join(" · ")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {data && data.count > data.per_page && (
            <div className="mt-8">
              <Pagination
                page={page}
                total={data.count}
                perPage={data.per_page}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}

"use client";

import { Palette, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/search/Pagination";
import { ThemePreviewCard } from "@/components/themes/ThemePreviewCard";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { themes } from "@/lib/api";

export default function ThemesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate } = useSWR(`themes/all/${page}`, () =>
    themes.getAll(page),
  );

  const results = data?.results ?? [];

  return (
    <Container className="py-10">
      <PageHeader
        icon={Palette}
        title="Themes"
        description="Two-color Discord profile theme combinations, submitted by the community. Click one to copy its colors."
        actions={
          <Link
            href="/themes/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            <Plus size={14} />
            Submit a Theme
          </Link>
        }
      />

      {error ? (
        <ErrorState
          message="We couldn't load themes right now."
          onRetry={() => mutate()}
        />
      ) : isLoading ? (
        <LoadingState />
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
                className="block rounded-2xl transition-transform hover:scale-[1.02]"
              >
                <ThemePreviewCard
                  themeName={theme.name}
                  tags={theme.tags}
                  primaryColor={theme.primary_color}
                  secondaryColor={theme.secondary_color}
                  owner={theme.owner}
                  compact
                />
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

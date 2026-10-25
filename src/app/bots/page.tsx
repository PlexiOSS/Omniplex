import Link from "next/link";
import { BrowseControls, browseHref } from "@/components/browse/BrowseControls";
import { UrlPagination } from "@/components/browse/UrlPagination";
import { BotCard } from "@/components/cards/BotCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { bots } from "@/lib/api";
import type { BotBrowseSort, IndexBot, PagedResult } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCountLabel } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{
    sort?: string;
    tag?: string;
    certified?: string;
    page?: string;
  }>;
}

const DEFAULT_SORT: BotBrowseSort = "new";

const SORTS: { value: BotBrowseSort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "votes", label: "Top voted" },
  { value: "trending", label: "Trending" },
  { value: "servers", label: "Most servers" },
];

export default async function BotsPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort: BotBrowseSort =
    SORTS.find((s) => s.value === params.sort)?.value ?? DEFAULT_SORT;
  const tag = (params.tag ?? "").trim().slice(0, 64);
  const certified = params.certified === "true";
  const page = Math.max(1, Number(params.page) || 1);
  const state = { sort, tag, certified };

  let data: PagedResult<IndexBot[]>;
  try {
    data = await bots.getAll(page, { sort, tag: tag || undefined, certified });
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    throw err;
  }

  const filtered = !!tag || certified || sort === "trending";

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          All Bots
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Browse every bot listed on Omniplex.{" "}
          {formatCountLabel(data.count, "bot")}
          {filtered ? " match these filters." : " in total."}
        </p>
      </div>

      <BrowseControls
        basePath="/bots"
        state={state}
        defaultSort={DEFAULT_SORT}
        sorts={SORTS}
        tags={BOT_TAGS}
        searchLabel="Search bots"
      />

      {data.results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">
            {sort === "trending"
              ? "Nothing has been voted on in the last 7 days with these filters."
              : "No bots match these filters."}
          </p>
          <Link
            href={browseHref("/bots", state, DEFAULT_SORT, {
              tag: "",
              certified: false,
              sort: DEFAULT_SORT,
            })}
            className="mt-3 text-sm font-medium text-accent hover:underline"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((bot) => (
              <BotCard key={bot.bot_id} bot={bot} />
            ))}
          </div>
          {data.count > data.per_page && (
            <div className="mt-10">
              <UrlPagination
                page={page}
                total={data.count}
                perPage={data.per_page}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}

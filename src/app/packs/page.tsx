import type { Metadata } from "next";
import Link from "next/link";
import { UrlPagination } from "@/components/browse/UrlPagination";
import { PackCard } from "@/components/cards/PackCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { packs } from "@/lib/api";
import type { BotPack, PackType, PagedResult } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCountLabel } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Packs" };

const FILTERS: { value: PackType | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "bot", label: "Bots" },
  { value: "server", label: "Servers" },
  { value: "emoji", label: "Emojis" },
  { value: "sticker", label: "Stickers" },
  { value: "sound", label: "Sounds" },
];

function isPackType(value: string | undefined): value is PackType {
  return (
    value === "bot" ||
    value === "server" ||
    value === "emoji" ||
    value === "sticker" ||
    value === "sound"
  );
}

type PackSort = "votes" | "new";

interface Props {
  searchParams: Promise<{
    pack_type?: string;
    sort?: string;
    all?: string;
    page?: string;
  }>;
}

interface PackState {
  type?: PackType;
  sort: PackSort;
  all: boolean;
}

function packsHref(state: PackState, changes: Partial<PackState>): string {
  const next = { ...state, ...changes };
  const params = new URLSearchParams();
  if (next.type) params.set("pack_type", next.type);
  if (next.sort !== "votes") params.set("sort", next.sort);
  if (next.all) params.set("all", "true");
  const qs = params.toString();
  return qs ? `/packs?${qs}` : "/packs";
}

const SORTS: { value: PackSort; label: string }[] = [
  { value: "votes", label: "Top" },
  { value: "new", label: "Newest" },
];

export default async function PacksPage({ searchParams }: Props) {
  const params = await searchParams;
  const state: PackState = {
    type: isPackType(params.pack_type) ? params.pack_type : undefined,
    sort: params.sort === "new" ? "new" : "votes",
    all: params.all === "true",
  };
  const page = Math.max(1, Number(params.page) || 1);

  let data: PagedResult<BotPack[]>;
  try {
    data = await packs.getAll(page, state.type, {
      sort: state.sort,
      all: state.all,
    });
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
    throw err;
  }

  const packList = data.results;

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Packs
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Curated collections of bots, servers, and emojis.{" "}
          {formatCountLabel(data.count, "pack")}
          {state.type || !state.all ? " match these filters." : " in total."}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <Link
              key={filter.label}
              href={packsHref(state, { type: filter.value })}
              scroll={false}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                state.type === filter.value
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              {filter.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            {SORTS.map((opt) => (
              <Link
                key={opt.value}
                href={packsHref(state, { sort: opt.value })}
                scroll={false}
                className={[
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  state.sort === opt.value
                    ? "bg-accent/10 text-accent"
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {opt.label}
              </Link>
            ))}
          </div>
          <Link
            href={packsHref(state, { all: !state.all })}
            scroll={false}
            className={[
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              state.all
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {state.all ? "Showing all packs" : "Show all packs"}
          </Link>
        </div>
      </div>

      {packList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">No packs match these filters.</p>
          {(state.type || !state.all) && (
            <Link
              href={packsHref(state, { type: undefined, all: true })}
              className="mt-3 text-sm font-medium text-accent hover:underline"
            >
              Show every pack
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packList.map((pack) => (
              <PackCard key={pack.url} pack={pack} />
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

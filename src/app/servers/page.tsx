import { Server } from "lucide-react";
import Link from "next/link";
import { BrowseControls, browseHref } from "@/components/browse/BrowseControls";
import { UrlPagination } from "@/components/browse/UrlPagination";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { servers } from "@/lib/api";
import type {
  IndexServer,
  PagedResult,
  ServerBrowseSort,
} from "@/lib/api/types";
import { SERVER_TAGS } from "@/lib/constants/tags";
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

const DEFAULT_SORT: ServerBrowseSort = "new";

const SORTS: { value: ServerBrowseSort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "votes", label: "Top voted" },
  { value: "trending", label: "Trending" },
  { value: "members", label: "Most members" },
];

export default async function ServersPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort: ServerBrowseSort =
    SORTS.find((s) => s.value === params.sort)?.value ?? DEFAULT_SORT;
  const tag = (params.tag ?? "").trim().slice(0, 64);
  const certified = params.certified === "true";
  const page = Math.max(1, Number(params.page) || 1);
  const state = { sort, tag, certified };

  let data: PagedResult<IndexServer[]>;
  try {
    data = await servers.getAll(page, {
      sort,
      tag: tag || undefined,
      certified,
    });
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    throw err;
  }

  const filtered = !!tag || certified || sort === "trending";

  return (
    <Container className="py-10">
      <PageHeader
        icon={Server}
        title="All Servers"
        description={
          <>
            Browse Discord servers listed on Omniplex.{" "}
            {formatCountLabel(data.count, "server", "servers")}
            {filtered ? " match these filters." : " in total."}
          </>
        }
      />

      <BrowseControls
        basePath="/servers"
        state={state}
        defaultSort={DEFAULT_SORT}
        sorts={SORTS}
        tags={SERVER_TAGS}
        searchLabel="Search servers"
      />

      {data.results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">
            {sort === "trending"
              ? "Nothing has been voted on in the last 7 days with these filters."
              : "No servers match these filters."}
          </p>
          <Link
            href={browseHref("/servers", state, DEFAULT_SORT, {
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
            {data.results.map((server) => (
              <ServerCard key={server.server_id} server={server} />
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

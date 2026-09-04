import type { Metadata } from "next";
import Link from "next/link";
import { PackCard } from "@/components/cards/PackCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { packs } from "@/lib/api";
import type { PackType } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";

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

interface Props {
  searchParams: Promise<{ pack_type?: string }>;
}

export default async function PacksPage({ searchParams }: Props) {
  const { pack_type } = await searchParams;
  const activeType = isPackType(pack_type) ? pack_type : undefined;

  let data = null;
  try {
    data = await packs.getAll(1, activeType);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
  }

  const packList = data?.results ?? [];

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Packs
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Curated collections of bots, servers, and emojis.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/packs?pack_type=${filter.value}` : "/packs"}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeType === filter.value
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {packList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">No packs available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packList.map((pack) => (
            <PackCard key={pack.url} pack={pack} />
          ))}
        </div>
      )}
    </Container>
  );
}

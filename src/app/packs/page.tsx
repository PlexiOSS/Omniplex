import type { Metadata } from "next";
import { PackCard } from "@/components/cards/PackCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { packs } from "@/lib/api";
import { isApiUnavailable } from "@/lib/utils/errors";

export const metadata: Metadata = { title: "Bot Packs" };

export default async function PacksPage() {
  let data = null;
  try {
    data = await packs.getAll();
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
  }

  const packList = data?.results ?? [];

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Bot Packs
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Curated collections of bots for every kind of server.
        </p>
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

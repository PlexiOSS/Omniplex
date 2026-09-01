import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PackCard } from "@/components/cards/PackCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Button } from "@/components/ui/Button";
import { packs } from "@/lib/api";
import { isApiUnavailable } from "@/lib/utils/errors";

export const metadata: Metadata = {
  title: "Emoji Packs",
  description:
    "Browse community-made emoji packs and download them straight into your own Discord server.",
};

export default async function EmojisPage() {
  let data = null;
  try {
    data = await packs.getAll(1, "emoji");
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
  }

  const packList = data?.results ?? [];

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Emoji Packs
          </h1>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Curated collections of emojis, bundled by other users. Download
            one as a .zip and upload it straight into your own server.
          </p>
        </div>
        <Link href="/packs/add?type=emoji">
          <Button type="button" variant="secondary">
            <Plus size={14} />
            Create a Pack
          </Button>
        </Link>
      </div>

      {packList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">No emoji packs yet. Be the first to make one.</p>
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

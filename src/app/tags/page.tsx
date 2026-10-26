import { Tags } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { list } from "@/lib/api";
import type { ListTags } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { TagDirectory } from "./TagDirectory";

export const metadata: Metadata = {
  title: "All Tags",
  description:
    "Browse every tag used by Discord bots and servers on Omniplex, from Moderation and Music to the niche ones.",
};

export default async function TagsPage() {
  let data: ListTags;
  try {
    data = await list.getTags();
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
    throw err;
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Tags size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          All Tags
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {formatCount(data.tags.length)} tags used by bots and servers on
          Omniplex. Pick one to see everything tagged with it.
        </p>
      </div>
      <TagDirectory tags={data.tags} />
    </Container>
  );
}

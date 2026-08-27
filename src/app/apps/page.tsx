import { ArrowRight, Briefcase } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { apps } from "@/lib/api";

export const metadata: Metadata = {
  title: "Apply",
  description: "Open positions and programs you can apply for on Omniplex.",
};

/** Strips markdown/HTML formatting down to a short plain-text teaser for the card grid — the full Info renders on the position's own page. */
function preview(info: string, max = 180): string {
  const stripped = info
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > max ? `${stripped.slice(0, max).trim()}…` : stripped;
}

export default async function AppsPage() {
  const meta = await apps.getMeta().catch(() => null);
  const positions = (meta?.positions ?? []).filter((p) => !p.hidden);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Briefcase size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Apply
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Join the staff or dev team, partner with us, or apply for
          certification. Every application goes to a real person on the
          other end.
        </p>
      </div>

      {!meta ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Couldn't load open positions right now — check back shortly.
        </p>
      ) : positions.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          There aren't any open positions right now.
        </p>
      ) : (
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {positions.map((position) => (
            <Link
              key={position.id}
              href={`/apps/${position.id}`}
              className="group flex flex-col rounded-2xl border border-zinc-200 p-5 transition-colors hover:border-accent/40 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {position.name}
                </p>
                {position.closed && <Badge variant="danger">Closed</Badge>}
              </div>

              {position.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {position.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}

              <p className="mt-3 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
                {preview(position.info)}
              </p>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                {position.closed ? "View details" : "Apply"}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}

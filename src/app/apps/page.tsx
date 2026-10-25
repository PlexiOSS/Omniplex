import { ArrowRight, Briefcase, ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { apps } from "@/lib/api";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Join the team, apply for certification or partnership, or request a re-review of a denied bot.",
};

type Position = NonNullable<
  Awaited<ReturnType<typeof apps.getMeta>>
>["positions"][number];

const SECTIONS: {
  key: string;
  title: string;
  description: string;
  ids: string[];
}[] = [
  {
    key: "team",
    title: "Join the team",
    description:
      "Help review listings, support the community, or build Omniplex.",
    ids: ["staff", "dev"],
  },
  {
    key: "programs",
    title: "Programs",
    description: "Get your bot or server certified, or partner with us.",
    ids: ["certification", "server_certification", "partners"],
  },
  {
    key: "owners",
    title: "For bot owners",
    description: "Fixed what got your bot denied? Ask for another review.",
    ids: ["resubmit"],
  },
];

const REQUIREMENTS: Record<string, { href: string; label: string }> = {
  staff: { href: "/kb/programs/applications", label: "How applying works" },
  dev: { href: "/kb/programs/applications", label: "How applying works" },
  certification: {
    href: "/kb/programs/certification",
    label: "Certification requirements",
  },
  server_certification: {
    href: "/kb/programs/certification",
    label: "Certification requirements",
  },
  partners: { href: "/kb/programs/partnership", label: "Partner requirements" },
  resubmit: { href: "/kb/bots/rules", label: "Bot Rules" },
};

const ALWAYS_HIDDEN = new Set(["banappeal"]);

function preview(info: string, max = 160): string {
  const stripped = info
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > max ? `${stripped.slice(0, max).trim()}…` : stripped;
}

function PositionCard({ position }: { position: Position }) {
  const requirements = REQUIREMENTS[position.id];
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
          {position.name}
        </p>
        {position.closed ? (
          <Badge variant="danger">Closed</Badge>
        ) : (
          <Badge variant="success">Open</Badge>
        )}
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
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <Link
          href={`/apps/${position.id}`}
          className="group inline-flex items-center gap-1 text-sm font-medium text-accent"
        >
          {position.closed ? "View details" : "Apply"}
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
        {requirements && (
          <Link
            href={requirements.href}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {requirements.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function AppsPage() {
  const meta = await apps.getMeta().catch(() => null);
  const positions = (meta?.positions ?? []).filter(
    (p) => !ALWAYS_HIDDEN.has(p.id) && (!p.hidden || p.id === "resubmit"),
  );
  const placed = new Set(SECTIONS.flatMap((s) => s.ids));
  const sections = [
    ...SECTIONS.map((section) => ({
      ...section,
      positions: section.ids
        .map((id) => positions.find((p) => p.id === id))
        .filter((p): p is Position => !!p),
    })),
    {
      key: "other",
      title: "Other",
      description: "",
      ids: [],
      positions: positions.filter((p) => !placed.has(p.id)),
    },
  ].filter((s) => s.positions.length > 0);

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
          Join the team, apply for certification or partnership, or ask for a
          denied bot to be reviewed again. Every application is read by a real
          person.
        </p>
        <Link
          href="/dashboard?tab=applications"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ClipboardList size={14} />
          Your applications
        </Link>
      </div>

      {!meta ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Couldn&apos;t load open positions right now. Check back shortly.
        </p>
      ) : sections.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          There aren&apos;t any open positions right now.
        </p>
      ) : (
        <div className="mx-auto mt-12 max-w-4xl space-y-12">
          {sections.map((section) => (
            <section key={section.key}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {section.title}
                </h2>
                {section.description && (
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {section.description}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.positions.map((position) => (
                  <PositionCard key={position.id} position={position} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}

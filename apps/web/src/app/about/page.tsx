import { list } from "@omniplex/core/api";
import { formatCount } from "@omniplex/core/utils/format";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bot,
  Code2,
  Gavel,
  Layers,
  Megaphone,
  MessageSquareText,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BotAvatar, type BotKind } from "@/components/brand/BotAvatar";
import { OmiAvatar } from "@/components/brand/OmiAvatar";
import { Container } from "@/components/layout/Container";
import { totalListedBots } from "@/lib/utils/stats";

export const metadata: Metadata = {
  title: "About",
  description:
    "Omniplex is a community-driven place to discover, vote for and list Discord bots and servers, built on the legacy of Infinity Bot List.",
};

const FEATURES = [
  {
    icon: Bot,
    title: "Discover bots and servers",
    description:
      "Every listing is reviewed by our staff. Browse by tag, sort by votes or trending, and search everything at once.",
  },
  {
    icon: MessageSquareText,
    title: "Vote and review",
    description:
      "Your votes decide what rises, and reviews help others pick. Climb the monthly voter leaderboard while you're at it.",
  },
  {
    icon: Layers,
    title: "Packs",
    description:
      "Themed collections of bots or servers, plus packs of emojis, stickers and sounds you can download.",
  },
  {
    icon: Award,
    title: "Badges and linked roles",
    description:
      "Earn badges on Omniplex and turn them into Discord roles in any server that uses them.",
  },
  {
    icon: Code2,
    title: "Built for developers",
    description:
      "A public API, vote webhooks, stats posting, embeddable widgets and command docs for your bot's page.",
  },
  {
    icon: Megaphone,
    title: "Grow your listing",
    description:
      "Certification, premium and a shop paid for with vote credits help great bots and servers get seen.",
  },
];

const BOTS: {
  key: string;
  name: string;
  kind?: BotKind;
  role: string;
}[] = [
  {
    key: "omi",
    name: "Omi",
    role: "The official Omniplex bot. Keeps bot status and uptime up to date and posts listing updates.",
  },
  {
    key: "servers",
    name: "Omniplex Servers",
    kind: "servers",
    role: "Lists your server and keeps it in sync, and powers Discord linked roles.",
  },
  {
    key: "arcadia",
    name: "Arcadia",
    kind: "staff",
    role: "Our staff bot: the review queue, moderation and staff tools.",
  },
];

const LINKS = [
  {
    href: "/about/stats",
    label: "Platform stats",
    description: "Live numbers across the site",
    icon: BarChart3,
  },
  {
    href: "/about/moderation",
    label: "Moderation transparency",
    description: "How reports and reviews are handled",
    icon: Gavel,
  },
  {
    href: "/about/team",
    label: "The team",
    description: "The people behind Omniplex",
    icon: Users,
  },
  {
    href: "https://status.omniplex.gg",
    label: "System status",
    description: "Uptime and incidents",
    icon: Activity,
    external: true,
  },
  {
    href: "https://docs.omniplex.gg",
    label: "Developer docs",
    description: "The API, webhooks and widgets",
    icon: Code2,
    external: true,
  },
  {
    href: "/changelog",
    label: "Changelog",
    description: "What's new on Omniplex",
    icon: Megaphone,
  },
];

function sinceYear(iso: string | null | undefined) {
  return iso ? new Date(iso).getFullYear() : null;
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default async function AboutPage() {
  const [stats, history] = await Promise.all([
    list.getStats().catch(() => null),
    list.getStatsHistory().catch(() => null),
  ]);
  const votesSince = sinceYear(history?.votes_since);

  const numbers = stats
    ? [
        {
          label: "Bots listed",
          value: formatCount(totalListedBots(stats)),
          hint: `${formatCount(stats.total_certified_bots)} certified`,
        },
        {
          label: "Servers listed",
          value: formatCount(
            stats.total_approved_servers + stats.total_certified_servers,
          ),
          hint: "and growing",
        },
        {
          label: "Votes cast",
          value: formatCount(history?.votes_all_time ?? stats.total_votes),
          hint: history
            ? votesSince
              ? `since ${votesSince}`
              : "all time"
            : "this month",
        },
        {
          label: "Members",
          value: formatCount(stats.total_users),
          hint: history
            ? `${formatCount(history.voters_all_time)} have voted`
            : "signed up",
        },
      ]
    : [];

  return (
    <>
      <section className="relative overflow-hidden border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="pointer-events-none absolute -top-40 -left-20 h-96 w-[36rem] rounded-full bg-accent/15 blur-3xl" />
        <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            {/* biome-ignore lint/performance/noImgElement: static brand asset from /public */}
            <img
              src="/brand/logo/omniplex-app-icon-1024.png"
              alt=""
              className="h-14 w-14 rounded-2xl shadow-lg"
            />
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
              Find what makes your server great
            </h1>
            <p className="mt-4 max-w-lg text-lg text-zinc-500 dark:text-zinc-400">
              Omniplex is a community-driven place to discover, vote for and
              list Discord bots and servers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/bots"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
              >
                Browse bots <ArrowRight size={14} />
              </Link>
              <Link
                href="/bots/add"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Add your bot
              </Link>
              <Link
                href="/servers/add"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Add your server
              </Link>
            </div>
          </div>

          {numbers.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800">
                {numbers.map(({ label, value, hint }) => (
                  <div key={label} className="bg-white p-5 dark:bg-zinc-900">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {label}
                    </p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
                      {value}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      {hint}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/about/stats"
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:text-accent dark:text-zinc-300"
              >
                {history
                  ? `${formatCount(history.approvals)} listings approved by our team since ${sinceYear(history.reviews_since) ?? 2023}`
                  : "See all platform stats"}
                <ArrowRight size={14} className="shrink-0" />
              </Link>
            </div>
          )}
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <SectionHeading title="Our story" />
          <div className="space-y-4 text-zinc-600 dark:text-zinc-300">
            <p>
              Omniplex is built on the foundation of Infinity Bot List. We kept
              what the community trusted (fair reviews, real votes and a team
              that answers) and rebuilt everything around it: a faster site,
              servers and packs alongside bots, and tools that help developers
              and server owners grow.
            </p>
            <p>
              Every listing is still checked by a person on our team before it
              goes live.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <SectionHeading title="What you can do" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/15">
                <Icon size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
                {title}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <SectionHeading
            title="Meet the bots"
            description="Three bots keep Omniplex running behind the scenes."
          />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {BOTS.map((b) => (
            <div
              key={b.key}
              className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {b.kind ? (
                <BotAvatar
                  kind={b.kind}
                  aria-hidden="true"
                  className="h-12 w-12 shrink-0 rounded-xl"
                />
              ) : (
                <OmiAvatar
                  aria-hidden="true"
                  className="h-12 w-12 shrink-0 rounded-xl"
                />
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {b.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {b.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <SectionHeading
            title="Open and transparent"
            description="Powered by Popplio, our open-source backend, with a public API anyone can build on."
          />
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map(({ href, label, description, icon: Icon, external }) => (
            <Link
              key={href}
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-accent/10 group-hover:text-accent dark:bg-zinc-800 dark:text-zinc-300">
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {label}
                </span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {description}
                </span>
              </span>
              {external ? (
                <ArrowUpRight size={14} className="shrink-0 text-zinc-400" />
              ) : (
                <ArrowRight
                  size={14}
                  className="shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5"
                />
              )}
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}

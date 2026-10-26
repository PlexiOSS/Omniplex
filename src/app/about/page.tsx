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
import { Container } from "@/components/layout/Container";
import { list } from "@/lib/api";
import { formatCount } from "@/lib/utils/format";
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

const BOTS = [
  {
    key: "popplio",
    name: "Popplio",
    role: "The official Omniplex bot. Keeps bot status and uptime up to date and posts listing updates.",
  },
  {
    key: "infernoplex",
    name: "Infernoplex",
    role: "Lists your server and keeps it in sync, and powers Discord linked roles.",
  },
  {
    key: "arcadia",
    name: "Arcadia",
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

export default async function AboutPage() {
  const stats = await list.getStats().catch(() => null);

  const numbers = stats
    ? [
        { label: "Listed bots", value: totalListedBots(stats) },
        {
          label: "Listed servers",
          value: stats.total_approved_servers + stats.total_certified_servers,
        },
        { label: "Votes cast", value: stats.total_votes },
        { label: "Users", value: stats.total_users },
      ]
    : [];

  return (
    <>
      <section className="relative overflow-hidden border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        <Container className="relative py-20 text-center">
          {/* biome-ignore lint/performance/noImgElement: static brand asset from /public */}
          <img
            src="/brand/logo/omniplex-app-icon-1024.png"
            alt=""
            className="mx-auto h-16 w-16 rounded-2xl shadow-lg"
          />
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
            Find what makes your server great
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-500 dark:text-zinc-400">
            Omniplex is a community-driven place to discover, vote for and list
            Discord bots and servers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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

          {numbers.length > 0 && (
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {numbers.map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                    {formatCount(value)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/about/stats"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            See all platform stats <ArrowRight size={13} />
          </Link>
        </Container>
      </section>

      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Our story
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-300">
            Omniplex is built on the foundation of Infinity Bot List. We kept
            what the community trusted (fair reviews, real votes and a team that
            answers) and rebuilt everything around it: a faster site, servers
            and packs alongside bots, and tools that help developers and server
            owners grow.
          </p>
        </div>

        <h2 className="mt-20 text-center text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          What you can do
        </h2>
        <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <h2 className="mt-20 text-center text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Meet the bots
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Three bots keep Omniplex running behind the scenes.
        </p>
        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {BOTS.map((b) => (
            <div
              key={b.key}
              className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* biome-ignore lint/performance/noImgElement: static brand asset from /public */}
              <img
                src={`/brand/bots/${b.key}/app-icon-1024.png`}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl"
              />
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

        <h2 className="mt-20 text-center text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Open and transparent
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Powered by Popplio, our open-source backend, with a public API anyone
          can build on.
        </p>
        <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map(({ href, label, description, icon: Icon, external }) => (
            <Link
              key={href}
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
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

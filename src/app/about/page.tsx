import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Server, Star, Users } from "lucide-react";
import { list } from "@/lib/api";
import { Container } from "@/components/layout/Container";
import { formatCount } from "@/lib/utils/format";
import { totalListedBots } from "@/lib/utils/stats";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Omniplex — the best place to discover Discord bots and servers.",
};

const FEATURES = [
  {
    icon: Bot,
    title: "Discover Bots",
    description:
      "Browse thousands of approved and certified Discord bots across every category imaginable.",
  },
  {
    icon: Server,
    title: "Find Servers",
    description:
      "Explore active communities from gaming and art to education and support servers.",
  },
  {
    icon: Star,
    title: "Vote & Review",
    description:
      "Help surface the best bots by voting daily. Your votes directly influence rankings.",
  },
  {
    icon: Users,
    title: "Bot Packs",
    description:
      "Curated collections of bots built to work together — perfect for getting a server set up fast.",
  },
];

export default async function AboutPage() {
  const stats = await list.getStats().catch(() => null);

  return (
    <Container className="py-16">
      {/* Hero */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          The best place to discover Discord bots
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
          Omniplex is a community-driven listing platform where bot developers can
          share their work and server owners can find exactly what they need.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/bots"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            Browse Bots
          </Link>
          <Link
            href="/bots/add"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Add Your Bot
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Listed Bots", value: stats.total_approved_bots },
            { label: "Total Submitted", value: stats.total_bots },
            { label: "Total Votes", value: stats.total_votes },
            { label: "Users", value: stats.total_users },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800"
            >
              <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCount(value)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-10 text-center text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Everything you need
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Icon size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">{title}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open platform note */}
      <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Built on Popplio
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Omniplex is powered by Popplio, an open-source bot list backend. All
          data is served via a public API, enabling developers to build their
          own integrations and tools.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/about/status"
            className="text-sm text-accent underline underline-offset-2 hover:opacity-80"
          >
            Platform Status
          </Link>
          <Link
            href="/about/moderation"
            className="text-sm text-accent underline underline-offset-2 hover:opacity-80"
          >
            Moderation Transparency
          </Link>
        </div>
      </div>
    </Container>
  );
}

import {
  ArrowRight,
  BadgeCheck,
  Code2,
  Coins,
  Layers,
  Repeat,
  Scale,
  Server,
  Users,
  Webhook,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Omniplex vs top.gg and other Discord bot lists",
  description:
    "How Omniplex compares to top.gg, Discord Bot List and other Discord bot and server lists, and how to bring your bot or server over.",
  alternates: { canonical: "/alternatives" },
};

const FEATURES = [
  {
    icon: Coins,
    title: "Votes turn into perks",
    body: "Votes your listing receives convert into credits you can spend in the shop on premium days, featured slots, boosts and cosmetics. Premium isn't only something you buy.",
  },
  {
    icon: Server,
    title: "Bots and servers, equally",
    body: "Servers get the same pages, voting, reviews, premium, shop and widgets as bots, and go through the same review queue.",
  },
  {
    icon: Users,
    title: "Teams",
    body: "Own listings as a team with per-member permissions, so nobody has to share an account or token.",
  },
  {
    icon: Layers,
    title: "Packs, emojis, stickers and sounds",
    body: "Bundle bots and servers into packs, and browse and share emoji, sticker and sound packs alongside them.",
  },
  {
    icon: Repeat,
    title: "Fair, fresh rankings",
    body: "Vote counts reset monthly so rankings reflect who people are voting for now, and voting badges reward the people who show up.",
  },
  {
    icon: Webhook,
    title: "Developer-friendly",
    body: "HMAC-signed vote webhooks, a public API, stats posting, uptime tracking and embeddable widgets.",
  },
  {
    icon: BadgeCheck,
    title: "Real review and certification",
    body: "Every bot and server is checked by staff before it lists, and standout listings can apply for certification.",
  },
  {
    icon: Code2,
    title: "Open source",
    body: "The site and its API are licensed under the AGPL, so you can see exactly how listings, votes and rankings work.",
  },
];

const STEPS = [
  {
    title: "Add your bot or server",
    body: "Sign in with Discord and submit it. You can reuse your existing description; Markdown and most HTML work.",
    href: "/kb/bots/adding-a-bot",
    link: "Adding a bot",
  },
  {
    title: "Point your vote webhook at Omniplex",
    body: "Add a webhook in your dashboard and verify the HMAC signature. Each vote event carries the voter, the new count and whether it was an automatic vote.",
    href: "/kb/developers/vote-webhooks",
    link: "Vote webhooks",
  },
  {
    title: "Post your stats",
    body: "Send server and shard counts with your API token so your page shows live numbers and your bot shows as online.",
    href: "/kb/developers/posting-stats",
    link: "Posting stats",
  },
  {
    title: "Share your page and widget",
    body: "Swap your old vote link for your Omniplex page or vanity URL, and embed a widget in your README or website.",
    href: "/kb/developers/widgets",
    link: "Widgets",
  },
];

export default function AlternativesPage() {
  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Scale}
        title="Omniplex vs other bot lists"
        description="Already listed on top.gg, Discord Bot List or another directory? Here's what Omniplex does differently, and how to bring your bot or server over in a few minutes."
      />

      <div className="mx-auto max-w-5xl space-y-14">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            What you get on Omniplex
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-3.5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Moving over
          </h2>
          <p className="mt-1 mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            You don&apos;t have to leave another list to join Omniplex. Most
            owners list in several places, and these steps work alongside
            whatever you already use.
          </p>
          <ol className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 border-zinc-100 p-5 not-first:border-t dark:border-zinc-800"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {step.body}
                  </p>
                  <Link
                    href={step.href}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    {step.link}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-accent/25 bg-linear-to-br from-accent/10 via-white to-white p-6 text-center sm:p-8 dark:via-zinc-900 dark:to-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Ready to list?
          </h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Listing is free for bots and servers. Staff review new listings
            before they go live.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/bots/add">
              <Button variant="primary">Add a bot</Button>
            </Link>
            <Link href="/servers/add">
              <Button variant="secondary">Add a server</Button>
            </Link>
          </div>
        </section>
      </div>
    </Container>
  );
}

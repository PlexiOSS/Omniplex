import {
  ArrowRight,
  Code2,
  Compass,
  Gauge,
  KeyRound,
  Link2,
  Package,
  Rocket,
  SquareChevronRight,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";
import { OmniplexLogo } from "@/components/OmniplexLogo";

const FEATURES = [
  {
    icon: Code2,
    title: "API Reference",
    description:
      "Every Popplio endpoint for bots, servers, teams, votes, webhooks and more, generated from the API's own OpenAPI schema.",
    href: "/docs/api-reference",
  },
  {
    icon: Package,
    title: "SDKs",
    description:
      "Official libraries for JavaScript, Python, Go and Rust that post stats, check votes and verify webhooks for you.",
    href: "/docs/sdks",
  },
  {
    icon: Webhook,
    title: "Developer Docs",
    description:
      "The mechanics of building against Popplio: authentication, the team permission model, rate limits, posting stats, voting, and real-time webhooks.",
    href: "/docs/developer",
  },
  {
    icon: SquareChevronRight,
    title: "Guides",
    description:
      "Task-oriented walkthroughs: listing a bot, managing your server via Discord commands, setting a vanity URL.",
    href: "/docs/guides",
  },
];

const QUICK_LINKS = [
  {
    icon: Compass,
    title: "Getting Started",
    description: "Listing your first bot or server, on the main site.",
    href: "https://omniplex.gg/kb/basics/getting-started",
    external: true,
  },
  {
    icon: KeyRound,
    title: "Authentication",
    description: "API tokens for bots and servers.",
    href: "/docs/developer/authentication",
  },
  {
    icon: Rocket,
    title: "Listing a Bot",
    description: "Submission requirements and ownership rules.",
    href: "/docs/guides/listing-a-bot",
  },
  {
    icon: Gauge,
    title: "Rate Limits",
    description: "How Popplio's rate limiting works and how to handle it.",
    href: "/docs/developer/rate-limits",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Real-time notifications for votes and other events.",
    href: "/docs/developer/webhooks",
  },
  {
    icon: Link2,
    title: "Vanity URLs",
    description: "Setting a custom URL slug for your listing.",
    href: "/docs/guides/vanity-urls",
  },
];

const COMMUNITY_LINKS = [
  { icon: FaDiscord, text: "Discord", href: "https://discord.gg/zmQE9TZF9J" },
  { icon: FaGithub, text: "GitHub", href: "https://github.com/PlexiOSS" },
  {
    icon: FaTwitter,
    text: "Twitter / X",
    href: "https://twitter.com/InfinityBotList",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center px-6 py-24 text-center sm:py-32">
        <OmniplexLogo size={48} className="text-fd-foreground" />
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Omniplex Documentation
        </h1>
        <p className="mt-4 max-w-xl text-lg text-fd-muted-foreground">
          API reference and Discord bot commands for building on Omniplex, the
          Discord bot and server listing platform.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/docs/api-reference"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-fd-primary px-6 text-base font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://omniplex.gg"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-fd-border px-6 text-base font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            Back to Omniplex
          </a>
        </div>

        <div className="mt-10 flex items-center gap-5">
          {COMMUNITY_LINKS.map(({ icon: Icon, text, href }) => (
            <a
              key={text}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={text}
              className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </section>

      <section className="border-t border-fd-border">
        <div className="mx-auto grid max-w-5xl gap-px bg-fd-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, href }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col gap-3 bg-fd-background p-8 transition-colors hover:bg-fd-accent/50"
            >
              <Icon className="h-6 w-6 text-fd-primary" />
              <h2 className="font-semibold text-fd-foreground">{title}</h2>
              <p className="text-sm text-fd-muted-foreground">{description}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-fd-primary opacity-0 transition-opacity group-hover:opacity-100">
                Read more
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-fd-border px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-sm font-medium uppercase tracking-widest text-fd-muted-foreground">
            Popular pages
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map(
              ({ icon: Icon, title, description, href, external }) => (
                <Link
                  key={title}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group flex items-start gap-3 rounded-xl border border-fd-border p-4 transition-colors hover:bg-fd-accent/50"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fd-primary" />
                  <div>
                    <h3 className="text-sm font-medium text-fd-foreground">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-fd-muted-foreground">
                      {description}
                    </p>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

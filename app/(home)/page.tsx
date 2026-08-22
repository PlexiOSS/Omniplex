import Link from 'next/link';
import { ArrowRight, Code2, SquareChevronRight, Webhook } from 'lucide-react';
import { OmniplexLogo } from '@/components/OmniplexLogo';

const FEATURES = [
  {
    icon: Code2,
    title: 'API Reference',
    description:
      'The Popplio REST API powering Omniplex. Build your own integration.',
    href: '/docs/api-reference',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description:
      'Get notified in real time when a bot or server you own is voted for.',
    href: '/docs/developer/webhooks',
  },
  {
    icon: SquareChevronRight,
    title: 'Discord Bot Commands',
    description: "Manage your server's listing without leaving Discord.",
    href: '/docs/guides/bot-commands',
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
          API reference and Discord bot commands for building on Omniplex,
          the Discord bot and server listing platform.
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
      </section>

      <section className="border-t border-fd-border">
        <div className="mx-auto grid max-w-5xl gap-px bg-fd-border sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, href }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col gap-3 bg-fd-background p-8 transition-colors hover:bg-fd-accent/50"
            >
              <Icon className="h-6 w-6 text-fd-primary" />
              <h2 className="font-semibold text-fd-foreground">{title}</h2>
              <p className="text-sm text-fd-muted-foreground">
                {description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-fd-primary opacity-0 transition-opacity group-hover:opacity-100">
                Read more
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

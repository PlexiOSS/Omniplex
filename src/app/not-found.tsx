import {
  ArrowLeft,
  BookOpen,
  Bot,
  type LucideIcon,
  Search,
  Server,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { OmniplexLogo } from "@/components/ui/OmniplexLogo";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/bots", label: "Browse bots", icon: Bot },
  { href: "/servers", label: "Browse servers", icon: Server },
  { href: "/search", label: "Search", icon: Search },
  { href: "/kb", label: "Knowledge base", icon: BookOpen },
];

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="relative">
        <OmniplexLogo size={64} className="text-zinc-200 dark:text-zinc-800" />
        <span className="absolute -right-3 -bottom-2 rounded-full bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-fg shadow">
          404
        </span>
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        This page doesn&apos;t exist, or it was moved or removed. Try one of
        these instead.
      </p>
      <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-2">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <Icon size={16} className="shrink-0 text-accent" />
            {label}
          </Link>
        ))}
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Go home
      </Link>
    </Container>
  );
}

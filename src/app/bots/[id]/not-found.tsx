import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";

export default function BotNotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Bot not found
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        This bot doesn't exist or may have been removed.
      </p>
      <Link
        href="/bots"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Back to bots
      </Link>
    </Container>
  );
}

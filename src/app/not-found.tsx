import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm text-zinc-400 dark:text-zinc-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
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

'use client';

import { OmniplexLogo } from '@/components/OmniplexLogo';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <OmniplexLogo size={40} className="text-fd-muted-foreground" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-fd-muted-foreground">
        An unexpected error occurred while loading this page. You can try
        again, or head back to the docs.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-fd-border px-5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
        >
          Go home
        </a>
      </div>
    </main>
  );
}

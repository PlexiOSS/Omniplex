"use client";

import "./global.css";

// global-error replaces the root layout entirely when an error escapes it,
// so it renders its own <html>/<body> and avoids depending on providers
// (RootProvider, fonts, etc.) that could themselves be the failure.
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-fd-background px-6 text-center font-sans text-fd-foreground">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-fd-muted-foreground">
          An unexpected error occurred. Try reloading the page.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
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
      </body>
    </html>
  );
}

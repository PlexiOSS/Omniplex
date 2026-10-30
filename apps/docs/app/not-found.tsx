import Link from "next/link";
import { OmniplexLogo } from "@/components/OmniplexLogo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <OmniplexLogo size={40} className="text-fd-muted-foreground" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-fd-muted-foreground">
        The page you are looking for does not exist or may have moved.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/docs"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Go to docs
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-fd-border px-5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}

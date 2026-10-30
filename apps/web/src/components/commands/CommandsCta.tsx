import { ExternalLink, Terminal } from "lucide-react";

export function CommandsCta() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        <Terminal size={15} className="text-accent" />
        Own a bot?
      </div>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Document its commands so people can find it here. Send them to the
        Update Bot Commands endpoint with your bot's API token.
      </p>
      <a
        href="https://docs.omniplex.gg/docs/api-reference"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
      >
        API reference
        <ExternalLink size={13} />
      </a>
    </div>
  );
}

import { ExternalLink } from "lucide-react";
import { LinkIcon } from "@/components/ui/LinkIcon";

function hostOf(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

export function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group -mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-accent/10 group-hover:text-accent dark:bg-zinc-800 dark:text-zinc-400">
          <LinkIcon name={label} href={href} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{label}</span>
          <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
            {hostOf(href)}
          </span>
        </span>
      </span>
      <ExternalLink
        size={12}
        className="shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100"
      />
    </a>
  );
}

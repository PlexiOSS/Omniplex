import { Repeat } from "lucide-react";
import Link from "next/link";

export function AutoVotePrompt() {
  return (
    <Link
      href="/dashboard?tab=auto-vote"
      className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
    >
      <Repeat size={12} />
      Never miss a vote. Let Auto-vote vote for you.
    </Link>
  );
}

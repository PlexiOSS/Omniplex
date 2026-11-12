"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function ThemeOwnerActions({ ownerId }: { ownerId: string }) {
  const { session } = useAuth();
  if (session?.user_id !== ownerId) return null;

  return (
    <Link
      href="/dashboard?tab=themes"
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Settings size={14} />
      Manage your themes
    </Link>
  );
}

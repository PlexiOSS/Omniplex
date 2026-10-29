"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef } from "react";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  /** If true, submitting navigates to /search?q=... instead of calling onSearch */
  navigate?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchBar({
  defaultValue = "",
  placeholder = "Search bots, servers...",
  navigate = false,
  onSearch,
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    if (!q) return;
    if (navigate) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      onSearch?.(q);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={["relative", className].join(" ")}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
      />
    </form>
  );
}

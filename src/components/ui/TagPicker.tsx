"use client";

import { X } from "lucide-react";

interface TagPickerProps {
  available: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagPicker({ available, selected, onChange }: TagPickerProps) {
  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={[
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-accent text-accent-fg"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
            ].join(" ")}
          >
            {active && <X size={10} />}
            {tag}
          </button>
        );
      })}
    </div>
  );
}

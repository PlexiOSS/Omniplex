"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

interface TagPickerProps {
  available: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

/**
 * Popplio doesn't restrict tags to an enum — any string 3-30 chars passes
 * validation — so `available` is just a curated set of *suggestions*, not
 * the full universe of valid tags. Selected tags that aren't in `available`
 * (common on bots/servers with legacy or freely-typed tags) are always
 * rendered as removable chips regardless, so editing a listing never
 * silently drops a tag the UI doesn't happen to know about.
 */
export function TagPicker({
  available,
  selected,
  onChange,
  max = 5,
}: TagPickerProps) {
  const [customTag, setCustomTag] = useState("");

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || selected.length >= max) return;
    if (selected.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    onChange([...selected, trimmed]);
  }

  function removeTag(tag: string) {
    onChange(selected.filter((t) => t !== tag));
  }

  function submitCustomTag() {
    addTag(customTag);
    setCustomTag("");
  }

  const suggestions = available.filter(
    (tag) => !selected.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );

  return (
    <div className="space-y-2.5">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-fg"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="rounded-full hover:opacity-70"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length < max && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {selected.length < max && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCustomTag();
              }
            }}
            placeholder="Add a custom tag…"
            minLength={3}
            maxLength={30}
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          />
          <button
            type="button"
            onClick={submitCustomTag}
            disabled={customTag.trim().length < 3}
            className="flex items-center gap-1 rounded-xl border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        {selected.length}/{max} tags
      </p>
    </div>
  );
}

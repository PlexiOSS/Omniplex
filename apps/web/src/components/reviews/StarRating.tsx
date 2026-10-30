"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  size?: number;
  className?: string;
}

/** Read-only star display. */
export function StarRating({
  value,
  size = 14,
  className = "",
}: StarRatingProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-300 dark:text-zinc-700"
          }
        />
      ))}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

/** Interactive 1-5 star picker for review forms. */
export function StarRatingInput({
  value,
  onChange,
  size = 20,
}: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-300 dark:text-zinc-700"
            }
          />
        </button>
      ))}
    </div>
  );
}

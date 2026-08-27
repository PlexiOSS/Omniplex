"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  total,
  perPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  const [jumpValue, setJumpValue] = useState(String(page));

  // Keep the jump box in sync with the real page — both when Prev/Next move
  // it, and after a jump we just committed ourselves.
  useEffect(() => {
    setJumpValue(String(page));
  }, [page]);

  if (totalPages <= 1) return null;

  function commitJump(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setJumpValue(String(page));
      return;
    }
    const clamped = Math.min(Math.max(parsed, 1), totalPages);
    setJumpValue(String(clamped));
    if (clamped !== page) onPageChange(clamped);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft size={14} />
        Previous
      </Button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          commitJump(jumpValue);
        }}
        className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      >
        Page
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onBlur={(e) => commitJump(e.target.value)}
          aria-label="Jump to page"
          className="h-8 w-14 rounded-lg border border-zinc-200 bg-white text-center text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        of {totalPages}
      </form>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
        <ChevronRight size={14} />
      </Button>
    </div>
  );
}

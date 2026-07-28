"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
  if (totalPages <= 1) return null;

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
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Page {page} of {totalPages}
      </span>
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

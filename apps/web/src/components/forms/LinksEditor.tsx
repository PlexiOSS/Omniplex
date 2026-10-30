"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Link } from "@/lib/api/types";

interface LinksEditorProps {
  links: Link[];
  onChange: (links: Link[]) => void;
  max?: number;
}

type Row = Link & { id: string };

function newId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/**
 * Editor for a bot/server's `extra_links` (website, support server, docs,
 * donations, etc.) — public links only. Mirrors Popplio's validation
 * (`validators.ValidateExtraLinks`): name <= 64 chars, value <= 512 chars
 * and must be an HTTPS URL, max 20 links.
 *
 * Rows are keyed by a locally-generated id rather than array index, since
 * removing a row in the middle of the list would otherwise shift every
 * later row's index — React would reuse those DOM nodes for the wrong
 * data, causing focus to jump to the wrong input mid-edit.
 */
export function LinksEditor({ links, onChange, max = 20 }: LinksEditorProps) {
  const [rows, setRows] = useState<Row[]>(() =>
    links.map((l) => ({ ...l, id: newId() })),
  );

  function emit(next: Row[]) {
    setRows(next);
    onChange(next.map(({ id, ...link }) => link));
  }

  function updateRow(id: string, patch: Partial<Link>) {
    emit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (rows.length >= max) return;
    emit([...rows, { id: newId(), name: "", value: "" }]);
  }

  function removeRow(id: string) {
    emit(rows.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <input
            type="text"
            value={row.name}
            onChange={(e) => updateRow(row.id, { name: e.target.value })}
            placeholder="Website"
            maxLength={64}
            className="w-32 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          />
          <input
            type="url"
            value={row.value}
            onChange={(e) => updateRow(row.id, { value: e.target.value })}
            placeholder="https://…"
            maxLength={512}
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            aria-label="Remove link"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {rows.length < max && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-700"
        >
          <Plus size={14} />
          Add link
        </button>
      )}
    </div>
  );
}

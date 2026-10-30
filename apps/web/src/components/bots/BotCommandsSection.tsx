"use client";

import {
  ArrowRight,
  Pencil,
  Plus,
  Search,
  Terminal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { commandLabel } from "@/components/commands/commandLabel";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { bots as botsApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { BotCommand, BotCommandInput } from "@/lib/api/types";

interface BotCommandsSectionProps {
  botId: string;
  initialCommands: BotCommand[];
  canEdit: boolean;
  token?: string;
}

export function BotCommandsSection({
  botId,
  initialCommands,
  canEdit,
  token,
}: BotCommandsSectionProps) {
  const [commands, setCommands] = useState(initialCommands);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState("");

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? commands.filter((cmd) =>
        [cmd.name, cmd.description, cmd.usage, cmd.category].some((field) =>
          field?.toLowerCase().includes(needle),
        ),
      )
    : commands;

  const groups = new Map<string, BotCommand[]>();
  for (const cmd of visible) {
    const key = cmd.category.trim() || "Commands";
    if (!groups.has(key)) groups.set(key, []);
    // biome-ignore lint/style/noNonNullAssertion: just set above
    groups.get(key)!.push(cmd);
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Slash commands shown on your bot's page and in the Command
            Directory.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil size={12} />
            Edit Commands
          </Button>
        </div>
      )}

      {commands.length === 0 ? (
        <EmptyState icon={Terminal} title="No commands documented yet" />
      ) : (
        <>
          {commands.length > 8 && (
            <div className="relative mb-5">
              <Search
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`Filter ${commands.length} commands`}
                aria-label="Filter commands"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-9 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-accent/50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState icon={Search} title="No matching commands">
              Nothing matches &ldquo;{filter.trim()}&rdquo;.
            </EmptyState>
          ) : (
            <div className="space-y-6">
              {Array.from(groups.entries()).map(([category, cmds]) => (
                <div key={category}>
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {category}
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] tabular-nums normal-case tracking-normal dark:bg-zinc-800">
                      {cmds.length}
                    </span>
                  </p>
                  <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {cmds.map((cmd) => {
                      const label = commandLabel(cmd.name);
                      const usage = cmd.usage?.trim();
                      const showUsage =
                        usage &&
                        usage.toLowerCase() !== label.toLowerCase() &&
                        usage.toLowerCase() !== cmd.name.trim().toLowerCase();
                      return (
                        <div
                          key={cmd.id}
                          className="min-w-0 px-4 py-3 sm:flex sm:items-baseline sm:gap-4"
                        >
                          <div className="min-w-0 sm:w-56 sm:shrink-0">
                            <code className="inline-block rounded-md bg-accent/10 px-1.5 py-0.5 text-sm font-medium text-accent">
                              {label}
                            </code>
                            {showUsage && (
                              <p className="mt-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                {usage}
                              </p>
                            )}
                          </div>
                          {cmd.description && (
                            <p className="mt-1 min-w-0 text-sm text-zinc-600 sm:mt-0 dark:text-zinc-300">
                              {cmd.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/commands?bot=${encodeURIComponent(botId)}`}
            className="mt-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
          >
            Open in the Command Directory <ArrowRight size={14} />
          </Link>
        </>
      )}

      {editing && token && (
        <EditCommandsModal
          botId={botId}
          commands={commands}
          token={token}
          onClose={() => setEditing(false)}
          onSaved={setCommands}
        />
      )}
    </div>
  );
}

function EditCommandsModal({
  botId,
  commands,
  token,
  onClose,
  onSaved,
}: {
  botId: string;
  commands: BotCommand[];
  token: string;
  onClose: () => void;
  onSaved: (commands: BotCommand[]) => void;
}) {
  type Row = BotCommandInput & { key: string };

  function newKey(): string {
    return typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  }

  const [rows, setRows] = useState<Row[]>(
    commands.map((c) => ({
      key: newKey(),
      name: c.name,
      description: c.description,
      usage: c.usage,
      category: c.category,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(key: string, patch: Partial<BotCommandInput>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: newKey(), name: "", description: "", usage: "", category: "" },
    ]);
  }

  async function handleSave() {
    const cleaned = rows
      .map(({ key, ...r }) => ({ ...r, name: r.name.trim() }))
      .filter((r) => r.name);

    setSaving(true);
    setError(null);
    try {
      await botsApi.updateCommands(botId, cleaned, token);
      const { commands: fresh } = await botsApi.getCommands(botId);
      onSaved(fresh);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit Commands">
      <div className="space-y-4">
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {rows.map((row) => (
            <div
              key={row.key}
              className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <Input
                    id={`cmd-name-${row.key}`}
                    label="Name"
                    placeholder="/help"
                    value={row.name}
                    onChange={(e) =>
                      updateRow(row.key, { name: e.target.value })
                    }
                  />
                  <Input
                    id={`cmd-usage-${row.key}`}
                    label="Usage"
                    placeholder="/ban <user> [reason]"
                    value={row.usage}
                    onChange={(e) =>
                      updateRow(row.key, { usage: e.target.value })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label="Remove command"
                  className="mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id={`cmd-desc-${row.key}`}
                  label="Description"
                  placeholder="Shows the help menu"
                  value={row.description}
                  onChange={(e) =>
                    updateRow(row.key, { description: e.target.value })
                  }
                />
                <Input
                  id={`cmd-category-${row.key}`}
                  label="Category (optional)"
                  placeholder="Moderation"
                  value={row.category}
                  onChange={(e) =>
                    updateRow(row.key, { category: e.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={addRow}>
          <Plus size={14} />
          Add command
        </Button>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

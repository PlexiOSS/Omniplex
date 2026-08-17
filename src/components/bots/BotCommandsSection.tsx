"use client";

import { Pencil, Plus, Terminal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
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

  // Group by category — commands with no category fall under "Commands".
  const groups = new Map<string, BotCommand[]>();
  for (const cmd of commands) {
    const key = cmd.category.trim() || "Commands";
    if (!groups.has(key)) groups.set(key, []);
    // biome-ignore lint/style/noNonNullAssertion: just set above
    groups.get(key)!.push(cmd);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Commands
        </h2>
        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil size={12} />
            Edit Commands
          </Button>
        )}
      </div>

      {commands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Terminal
            size={28}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No commands documented yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([category, cmds]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                {category}
              </p>
              <div className="space-y-2">
                {cmds.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                        {cmd.name}
                      </code>
                      {cmd.usage && (
                        <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                          {cmd.usage}
                        </span>
                      )}
                    </div>
                    {cmd.description && (
                      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {cmd.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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

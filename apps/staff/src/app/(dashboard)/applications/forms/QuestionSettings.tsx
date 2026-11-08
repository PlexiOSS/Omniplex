"use client";

import type { AppQuestionType } from "@omniplex/core/api/types";
import {
  QUESTION_TYPES,
  questionChoices,
  questionKind,
} from "@omniplex/core/appQuestions";
import { Plus, X } from "lucide-react";
import type { AppPositionQuestion } from "@/lib/arcadia/types";

const field =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-accent/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";

const label = "mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400";

const CHOICE_TYPES: AppQuestionType[] = ["choice", "multi"];
const TEXT_TYPES: AppQuestionType[] = ["short", "long"];

export function QuestionSettings({
  question,
  earlier,
  onChange,
}: {
  question: AppPositionQuestion;
  earlier: AppPositionQuestion[];
  onChange: (patch: Partial<AppPositionQuestion>) => void;
}) {
  const kind = questionKind(question);
  const options = question.options ?? [];
  const parents = earlier.filter((q) => q.id && questionChoices(q).length > 0);
  const parent = parents.find((q) => q.id === question.show_if?.question_id);

  function setKind(next: AppQuestionType) {
    onChange({
      type: next,
      short: next === "short",
      flag: undefined,
      options: CHOICE_TYPES.includes(next)
        ? options.length >= 2
          ? options
          : ["", ""]
        : undefined,
      min_length: TEXT_TYPES.includes(next) ? question.min_length : undefined,
      max_length: TEXT_TYPES.includes(next) ? question.max_length : undefined,
    });
  }

  function setOption(i: number, value: string) {
    onChange({ options: options.map((o, j) => (j === i ? value : o)) });
  }

  function toggleShowValue(value: string) {
    if (!question.show_if) return;
    const values = question.show_if.values.includes(value)
      ? question.show_if.values.filter((v) => v !== value)
      : [...question.show_if.values, value];
    onChange({ show_if: { ...question.show_if, values } });
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <label className="block">
          <span className={label}>Answer type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AppQuestionType)}
            className={field}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {(TEXT_TYPES.includes(kind) || kind === "number" || kind === "url") && (
          <label className="block">
            <span className={label}>Placeholder</span>
            <input
              value={question.placeholder}
              maxLength={200}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className={field}
              placeholder="Shown in the empty answer box (optional)"
            />
          </label>
        )}
      </div>

      {CHOICE_TYPES.includes(kind) && (
        <div>
          <span className={label}>
            Choices{" "}
            {kind === "multi" ? "(people can pick several)" : "(pick one)"}
          </span>
          <div className="space-y-2">
            {options.map((o, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: options are edited in place and can be empty or repeated while typing
                key={i}
                className="flex items-center gap-2"
              >
                <input
                  value={o}
                  maxLength={100}
                  onChange={(e) => setOption(i, e.target.value)}
                  className={field}
                  placeholder={`Choice ${i + 1}`}
                />
                <button
                  type="button"
                  disabled={options.length <= 2}
                  onClick={() =>
                    onChange({ options: options.filter((_, j) => j !== i) })
                  }
                  aria-label="Remove choice"
                  className="rounded p-1.5 text-zinc-400 hover:text-red-600 disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={options.length >= 20}
              onClick={() => onChange({ options: [...options, ""] })}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent disabled:opacity-40"
            >
              <Plus size={12} />
              Add choice
            </button>
          </div>
        </div>
      )}

      {TEXT_TYPES.includes(kind) && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <label className="block">
            <span className={label}>Min characters</span>
            <input
              type="number"
              min={0}
              value={question.min_length ?? ""}
              onChange={(e) =>
                onChange({
                  min_length: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className={field}
              placeholder={kind === "long" ? "50" : "1"}
            />
          </label>
          <label className="block">
            <span className={label}>Max characters</span>
            <input
              type="number"
              min={0}
              value={question.max_length ?? ""}
              onChange={(e) =>
                onChange({
                  max_length: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className={field}
              placeholder={kind === "long" ? "10000" : "4096"}
            />
          </label>
        </div>
      )}

      {questionChoices(question).filter(Boolean).length > 0 && (
        <div>
          <span className={label}>
            Flag these answers for reviewers (optional)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {questionChoices(question)
              .filter(Boolean)
              .map((choice) => {
                const on = question.flag?.includes(choice) ?? false;
                return (
                  <button
                    key={choice}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      onChange({
                        flag: on
                          ? (question.flag ?? []).filter((f) => f !== choice)
                          : [...(question.flag ?? []), choice],
                      })
                    }
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      on
                        ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300",
                    ].join(" ")}
                  >
                    {choice}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={!!question.optional}
            onChange={(e) => onChange({ optional: e.target.checked })}
            className="size-4 accent-[var(--accent)]"
          />
          Optional
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={!!question.show_if}
            disabled={parents.length === 0}
            onChange={(e) =>
              onChange({
                show_if: e.target.checked
                  ? { question_id: parents[0].id, values: [] }
                  : null,
              })
            }
            className="size-4 accent-[var(--accent)]"
          />
          Only show for certain answers
          {parents.length === 0 && (
            <span className="text-xs text-zinc-400">
              (needs an earlier choice, yes or no, or rating question)
            </span>
          )}
        </label>
      </div>

      {question.show_if && (
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
          <label className="block">
            <span className={label}>When the answer to</span>
            <select
              value={question.show_if.question_id}
              onChange={(e) =>
                onChange({
                  show_if: { question_id: e.target.value, values: [] },
                })
              }
              className={field}
            >
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.question || p.id}
                </option>
              ))}
            </select>
          </label>
          {parent && (
            <div className="mt-2">
              <span className={label}>is any of</span>
              <div className="flex flex-wrap gap-1.5">
                {questionChoices(parent)
                  .filter(Boolean)
                  .map((choice) => {
                    const on = question.show_if?.values.includes(choice);
                    return (
                      <button
                        key={choice}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleShowValue(choice)}
                        className={[
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          on
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300",
                        ].join(" ")}
                      >
                        {choice}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

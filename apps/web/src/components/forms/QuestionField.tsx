"use client";

import type { AppQuestion } from "@omniplex/core/api/types";
import {
  lengthLimits,
  questionChoices,
  questionKind,
  splitMulti,
} from "@omniplex/core/appQuestions";
import { Check, Star } from "lucide-react";
import { TEXTAREA_CLASS } from "@/components/forms/FormSection";

function Pill({
  selected,
  onClick,
  children,
  multi = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
        selected
          ? "border-accent bg-accent/10 font-medium text-zinc-950 dark:text-zinc-50"
          : "border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-4 shrink-0 items-center justify-center border",
          multi ? "rounded" : "rounded-full",
          selected
            ? "border-accent bg-accent text-accent-fg"
            : "border-zinc-300 dark:border-zinc-600",
        ].join(" ")}
      >
        {selected && <Check size={11} strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}

export function QuestionField({
  question,
  value,
  onChange,
}: {
  question: AppQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const kind = questionKind(question);
  const id = `q-${question.id}`;

  if (kind === "short" || kind === "long") {
    const [min, max] = lengthLimits(question);
    const count = [...value.trim()].length;
    return kind === "short" ? (
      <input
        id={id}
        aria-label={question.question}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={max}
        className={TEXTAREA_CLASS}
      />
    ) : (
      <>
        <textarea
          id={id}
          aria-label={question.question}
          rows={5}
          maxLength={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className={`resize-y ${TEXTAREA_CLASS}`}
        />
        <p
          className={[
            "mt-1.5 text-right text-xs tabular-nums",
            count >= min
              ? "text-green-600 dark:text-green-400"
              : "text-zinc-400",
          ].join(" ")}
        >
          {count} / {min} min
        </p>
      </>
    );
  }

  if (kind === "number" || kind === "url") {
    return (
      <input
        id={id}
        aria-label={question.question}
        type={kind === "number" ? "number" : "url"}
        inputMode={kind === "number" ? "decimal" : "url"}
        placeholder={
          question.placeholder || (kind === "url" ? "https://" : undefined)
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={TEXTAREA_CLASS}
      />
    );
  }

  if (kind === "rating") {
    const current = Number(value) || 0;
    return (
      <fieldset className="flex items-center gap-1">
        <legend className="sr-only">{question.question}</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={current === n}
            aria-label={`${n} out of 5`}
            onClick={() => onChange(String(n))}
            className="rounded-lg p-1 transition-transform hover:scale-110"
          >
            <Star
              size={26}
              className={
                n <= current
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-300 dark:text-zinc-600"
              }
            />
          </button>
        ))}
        {current > 0 && (
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
            {current} out of 5
          </span>
        )}
      </fieldset>
    );
  }

  const choices = questionChoices(question);

  if (kind === "multi") {
    const picked = splitMulti(value);
    const toggle = (choice: string) => {
      const next = picked.includes(choice)
        ? picked.filter((p) => p !== choice)
        : [...picked, choice];
      onChange(choices.filter((c) => next.includes(c)).join("\n"));
    };
    return (
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">{question.question}</legend>
        {choices.map((choice) => (
          <Pill
            key={choice}
            multi
            selected={picked.includes(choice)}
            onClick={() => toggle(choice)}
          >
            {choice}
          </Pill>
        ))}
      </fieldset>
    );
  }

  return (
    <fieldset
      className={
        kind === "yesno" ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"
      }
    >
      <legend className="sr-only">{question.question}</legend>
      {choices.map((choice) => (
        <Pill
          key={choice}
          selected={value === choice}
          onClick={() => onChange(value === choice ? "" : choice)}
        >
          {choice}
        </Pill>
      ))}
    </fieldset>
  );
}

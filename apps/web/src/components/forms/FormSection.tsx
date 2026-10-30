import { Check } from "lucide-react";
import type { ReactNode } from "react";

export const TEXTAREA_CLASS =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600";

interface FormSectionProps {
  step?: number;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

export function FormSection({
  step,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-start gap-3">
        {step !== undefined && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent ring-1 ring-accent/15">
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

interface FormLayoutProps {
  children: ReactNode;
  aside: ReactNode;
}

export function FormLayout({ children, aside }: FormLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">{children}</div>
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4">{aside}</div>
      </aside>
    </div>
  );
}

interface FormStepsProps {
  steps: string[];
  current: number;
}

export function FormSteps({ steps, current }: FormStepsProps) {
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto overflow-y-hidden text-sm">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2">
            {i > 0 && (
              <span
                className={[
                  "h-px w-6 sm:w-10",
                  done || active
                    ? "bg-accent/50"
                    : "bg-zinc-200 dark:bg-zinc-800",
                ].join(" ")}
              />
            )}
            <span
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                done
                  ? "bg-accent text-accent-fg"
                  : active
                    ? "bg-accent/10 text-accent ring-1 ring-accent/40"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
              ].join(" ")}
            >
              {done ? <Check size={12} /> : i + 1}
            </span>
            <span
              className={
                active
                  ? "font-medium text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
      {children}
    </div>
  );
}

interface FieldLabelProps {
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  count?: ReactNode;
  children: ReactNode;
}

export function FieldLabel({
  htmlFor,
  required,
  hint,
  count,
  children,
}: FieldLabelProps) {
  const label = (
    <>
      {children}
      {required && <span className="text-red-500"> *</span>}
      {hint && (
        <span className="ml-1.5 text-xs font-normal text-zinc-400">{hint}</span>
      )}
    </>
  );
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      ) : (
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </p>
      )}
      {count !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-zinc-400">
          {count}
        </span>
      )}
    </div>
  );
}

export function NsfwToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
      />
      <span>
        <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          NSFW
        </span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </span>
    </label>
  );
}

interface FormChecklistProps {
  title: string;
  items: ReactNode[];
  numbered?: boolean;
}

export function FormChecklist({ title, items, numbered }: FormChecklistProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      <ol className="mt-3 space-y-2.5">
        {items.map((item, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            key={i}
            className="flex gap-2.5 text-sm text-zinc-600 dark:text-zinc-300"
          >
            <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
              {numbered ? i + 1 : <Check size={10} />}
            </span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

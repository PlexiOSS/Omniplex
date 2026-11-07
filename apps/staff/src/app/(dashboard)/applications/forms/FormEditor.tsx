"use client";

import { Button } from "@omniplex/ui/Button";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  AppPosition,
  AppPositionInput,
  AppPositionQuestion,
} from "@/lib/arcadia/types";

const field =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";
const label = "text-sm font-medium text-zinc-700 dark:text-zinc-300";
const hint = "text-xs text-zinc-500 dark:text-zinc-400";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      {description && <p className={`mt-0.5 ${hint}`}>{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-zinc-200 p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
      <span>
        <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {title}
        </span>
        <span className={`block ${hint}`}>{body}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-accent"
      />
    </label>
  );
}

interface FormEditorProps {
  position?: AppPosition;
}

const EMPTY: AppPositionInput = {
  id: "",
  name: "",
  info: "",
  tags: [],
  questions: [
    { id: "", question: "", paragraph: "", placeholder: "", short: false },
  ],
  hidden: false,
  closed: true,
  requires_main_server: false,
  cooldown_secs: 0,
  approval_note: "",
  help_url: "",
  help_label: "",
};

export function FormEditor({ position }: FormEditorProps) {
  const { loginToken } = useAdmin();
  const router = useRouter();
  const isNew = !position;
  const locked = new Set(position?.behaviour?.locked_questions ?? []);

  const [form, setForm] = useState<AppPositionInput>(() =>
    position
      ? {
          id: position.id,
          name: position.name,
          info: position.info,
          tags: position.tags,
          questions: position.questions,
          hidden: position.hidden,
          closed: position.closed,
          requires_main_server: position.requires_main_server,
          cooldown_secs: position.cooldown_secs,
          approval_note: position.approval_note,
          help_url: position.help_url,
          help_label: position.help_label,
        }
      : EMPTY,
  );
  const [idTouched, setIdTouched] = useState(!isNew);
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const cooldownDays = form.cooldown_secs / 86400;

  function set<K extends keyof AppPositionInput>(
    key: K,
    value: AppPositionInput[K],
  ) {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setQuestion(i: number, patch: Partial<AppPositionQuestion>) {
    setSaved(false);
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)),
    }));
  }

  function moveQuestion(i: number, by: -1 | 1) {
    setSaved(false);
    setForm((f) => {
      const next = [...f.questions];
      const [q] = next.splice(i, 1);
      next.splice(i + by, 0, q);
      return { ...f, questions: next };
    });
  }

  function addTag() {
    const tag = tagDraft.trim();
    if (tag && !form.tags.includes(tag)) set("tags", [...form.tags, tag]);
    setTagDraft("");
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const questions = form.questions.map((q) => ({
        ...q,
        id: q.id || slugify(q.question),
      }));
      const result = await arcadia.appPositions.save(
        loginToken,
        isNew ? "Create" : "Update",
        { ...form, questions },
      );
      if (isNew) {
        router.replace(`/applications/forms/${result.id}`);
      } else {
        setForm((f) => ({ ...f, questions: result.questions }));
        setSaved(true);
      }
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!position) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await arcadia.appPositions.remove(loginToken, position.id);
      router.replace("/applications/forms");
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Couldn't delete.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <Link
        href="/applications/forms"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Application forms
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {isNew ? "New application form" : form.name || position?.name}
      </h1>
      {position && position.pending_apps > 0 && (
        <p className={`mt-1 ${hint}`}>
          {position.pending_apps} application
          {position.pending_apps === 1 ? " is" : "s are"} waiting for review.
          They keep the questions they were sent with.
        </p>
      )}

      {position?.behaviour && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" />
          <div className="text-sm">
            <p className="font-medium text-zinc-950 dark:text-zinc-50">
              Built-in behaviour: {position.behaviour.name}
            </p>
            <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
              {position.behaviour.description}
              {position.behaviour.locked_questions.length > 0 &&
                ` The ${position.behaviour.locked_questions.map((q) => `"${q}"`).join(", ")} question can be reworded but not removed.`}{" "}
              This form can't be deleted.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Section title="About">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="form-name" className={label}>
                  Name
                </label>
                <input
                  id="form-name"
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (isNew && !idTouched)
                      set("id", slugify(e.target.value).replace(/-/g, "_"));
                  }}
                  className={field}
                  placeholder="Staff Team"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="form-id" className={label}>
                  ID
                </label>
                <input
                  id="form-id"
                  value={form.id}
                  disabled={!isNew}
                  maxLength={40}
                  onChange={(e) => {
                    setIdTouched(true);
                    set("id", e.target.value.toLowerCase());
                  }}
                  className={`${field} font-mono`}
                  placeholder="staff_team"
                />
                <p className={hint}>
                  {isNew
                    ? "Used in the link. Can't be changed later."
                    : "Can't be changed."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="form-info" className={label}>
                Description
              </label>
              <textarea
                id="form-info"
                value={form.info}
                rows={8}
                maxLength={10000}
                onChange={(e) => set("info", e.target.value)}
                className={`${field} resize-y font-mono text-[13px]`}
              />
              <p className={hint}>
                Shown above the questions. Markdown and basic HTML work, and
                it's sanitised before it's shown.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="form-tags" className={label}>
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-0.5 pr-1 pl-2.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      onClick={() =>
                        set(
                          "tags",
                          form.tags.filter((t) => t !== tag),
                        )
                      }
                      className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  id="form-tags"
                  value={tagDraft}
                  maxLength={30}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder={form.tags.length ? "" : "Type a tag, then Enter"}
                  className="min-w-32 flex-1 bg-transparent px-1 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="form-help-url" className={label}>
                  Help link{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  id="form-help-url"
                  value={form.help_url}
                  onChange={(e) => set("help_url", e.target.value)}
                  className={field}
                  placeholder="/kb/programs/applications"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="form-help-label" className={label}>
                  Help link text
                </label>
                <input
                  id="form-help-label"
                  value={form.help_label}
                  maxLength={60}
                  disabled={!form.help_url}
                  onChange={(e) => set("help_label", e.target.value)}
                  className={field}
                  placeholder="How applying works"
                />
              </div>
            </div>
          </Section>

          <Section
            title="Questions"
            description="Asked in this order. Short answers get a one-line box, long answers a larger one."
          >
            <ol className="space-y-3">
              {form.questions.map((q, i) => {
                const isLocked = locked.has(q.id);
                return (
                  <li
                    // biome-ignore lint/suspicious/noArrayIndexKey: questions can be new with no ID yet
                    key={i}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-400 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {isLocked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                          <Lock size={10} />
                          Used by the built-in behaviour
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => moveQuestion(i, -1)}
                          aria-label="Move question up"
                          className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={i === form.questions.length - 1}
                          onClick={() => moveQuestion(i, 1)}
                          aria-label="Move question down"
                          className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={isLocked || form.questions.length === 1}
                          onClick={() =>
                            set(
                              "questions",
                              form.questions.filter((_, j) => j !== i),
                            )
                          }
                          aria-label="Remove question"
                          className="rounded p-1 text-zinc-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                      <input
                        aria-label="Question"
                        value={q.question}
                        maxLength={200}
                        onChange={(e) =>
                          setQuestion(i, { question: e.target.value })
                        }
                        className={field}
                        placeholder="What's the question?"
                      />
                      <input
                        aria-label="Question ID"
                        value={q.id}
                        disabled={isLocked}
                        maxLength={40}
                        onChange={(e) =>
                          setQuestion(i, { id: e.target.value.toLowerCase() })
                        }
                        className={`${field} font-mono`}
                        placeholder={slugify(q.question) || "question-id"}
                      />
                    </div>
                    <textarea
                      aria-label="Help text"
                      value={q.paragraph}
                      rows={2}
                      maxLength={1000}
                      onChange={(e) =>
                        setQuestion(i, { paragraph: e.target.value })
                      }
                      className={`${field} mt-3 resize-y`}
                      placeholder="Help text shown under the question (optional)"
                    />
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        aria-label="Placeholder"
                        value={q.placeholder}
                        maxLength={200}
                        onChange={(e) =>
                          setQuestion(i, { placeholder: e.target.value })
                        }
                        className={field}
                        placeholder="Placeholder in the answer box (optional)"
                      />
                      <div className="inline-flex shrink-0 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
                        {[
                          [true, "Short"],
                          [false, "Long"],
                        ].map(([value, text]) => (
                          <button
                            key={String(value)}
                            type="button"
                            onClick={() =>
                              setQuestion(i, { short: value as boolean })
                            }
                            className={[
                              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                              q.short === value
                                ? "bg-accent/10 text-accent"
                                : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50",
                            ].join(" ")}
                          >
                            {text as string} answer
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <Button
              variant="secondary"
              size="sm"
              disabled={form.questions.length >= 30}
              onClick={() =>
                set("questions", [
                  ...form.questions,
                  {
                    id: "",
                    question: "",
                    paragraph: "",
                    placeholder: "",
                    short: false,
                  },
                ])
              }
            >
              <Plus size={13} />
              Add question
            </Button>
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Section title="Settings">
            <Toggle
              checked={!form.closed}
              onChange={(v) => set("closed", !v)}
              title="Open for applications"
              body="When closed, the form shows but can't be submitted."
            />
            <Toggle
              checked={form.hidden}
              onChange={(v) => set("hidden", v)}
              title="Hidden"
              body="Left off the Apply page. Only people with the link can find it."
            />
            <Toggle
              checked={form.requires_main_server}
              onChange={(v) => set("requires_main_server", v)}
              title="Must be in our Discord server"
              body="Applicants who aren't are told to join first."
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="form-cooldown" className={label}>
                Days before they can apply again
              </label>
              <input
                id="form-cooldown"
                type="number"
                min={0}
                max={365}
                step="any"
                value={Number.isFinite(cooldownDays) ? cooldownDays : 0}
                onChange={(e) =>
                  set(
                    "cooldown_secs",
                    Math.round(
                      Math.max(0, Number(e.target.value) || 0) * 86400,
                    ),
                  )
                }
                className={field}
              />
              <p className={hint}>0 means no wait.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="form-approval" className={label}>
                Message when approved{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="form-approval"
                value={form.approval_note}
                rows={3}
                maxLength={1000}
                onChange={(e) => set("approval_note", e.target.value)}
                className={`${field} resize-y`}
                placeholder="Next steps, added to the approval notification"
              />
            </div>
          </Section>

          <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {saved && !error && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Saved.
              </p>
            )}
            <Button
              variant="primary"
              className="w-full"
              loading={saving}
              onClick={save}
            >
              {isNew ? "Create form" : "Save changes"}
            </Button>
            {position && !position.behaviour && (
              <Button
                variant={confirmDelete ? "danger" : "ghost"}
                className="w-full"
                loading={deleting}
                onClick={remove}
              >
                <Trash2 size={14} />
                {confirmDelete ? "Click again to delete" : "Delete form"}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

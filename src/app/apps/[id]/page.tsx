"use client";

import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  JoinServerCard,
  useMainServerStatus,
} from "@/components/discord/JoinServerCard";
import {
  FormError,
  FormLayout,
  FormSection,
  TEXTAREA_CLASS,
} from "@/components/forms/FormSection";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Markdown } from "@/components/markdown/Markdown";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAppMeta } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";
import { apps } from "@/lib/api";
import { ApiError } from "@/lib/api/client";

const SHORT_MAX = 4096;
const PARAGRAPH_MIN = 50;
const PARAGRAPH_MAX = 10000;

export default function ApplyPage() {
  const params = useParams<{ id: string }>();
  const { session, isAuthenticated } = useAuth();
  const { member } = useMainServerStatus();
  const { data: meta, isLoading: metaLoading } = useAppMeta();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (metaLoading) return null;

  const position = meta?.positions.find((p) => p.id === params.id);

  if (!position) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This position doesn't exist or isn't open right now.
        </p>
        <Link
          href="/apps"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent"
        >
          <ArrowLeft size={14} />
          Back to applications
        </Link>
      </Container>
    );
  }

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !position) return;

    for (const q of position.questions) {
      const ans = (answers[q.id] ?? "").trim();
      if (!ans) return setError(`Please answer: ${q.question}`);
      if (q.short && ans.length > SHORT_MAX)
        return setError(`Answer for "${q.question}" is too long.`);
      if (!q.short && ans.length < PARAGRAPH_MIN)
        return setError(
          `Answer for "${q.question}" needs at least ${PARAGRAPH_MIN} characters.`,
        );
      if (!q.short && ans.length > PARAGRAPH_MAX)
        return setError(`Answer for "${q.question}" is too long.`);
    }

    setSubmitting(true);
    setError(null);
    try {
      const trimmed: Record<string, string> = {};
      for (const q of position.questions) {
        trimmed[q.id] = (answers[q.id] ?? "").trim();
      }
      await apps.create(
        session.user_id,
        { position: position.id, answers: trimmed },
        session.token,
      );
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to submit application.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const answered = position.questions.filter((q) => {
    const a = (answers[q.id] ?? "").trim();
    return q.short ? a.length > 0 : a.length >= PARAGRAPH_MIN;
  }).length;
  const total = position.questions.length;

  const about = (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        About this role
      </h2>
      {position.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {position.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
      <Markdown
        content={position.info}
        className="mt-3 text-sm text-zinc-600 dark:text-zinc-300"
      />
    </div>
  );

  return (
    <Container className="py-10">
      <Link
        href="/apps"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Back to applications
      </Link>

      <PageHeader
        icon={ClipboardList}
        title={position.name}
        description={
          position.closed
            ? "This position is closed right now."
            : `${total} ${total === 1 ? "question" : "questions"}. Longer answers need at least ${PARAGRAPH_MIN} characters.`
        }
        actions={
          position.closed ? <Badge variant="danger">Closed</Badge> : undefined
        }
      />

      {submitted ? (
        <FormLayout aside={about}>
          <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <CheckCircle2 size={32} className="mb-3 text-green-500" />
            <p className="font-medium text-zinc-950 dark:text-zinc-50">
              Application submitted
            </p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              We'll review it and follow up. You can check its status from your
              dashboard any time.
            </p>
            <Link href="/dashboard" className="mt-5">
              <Button variant="secondary" size="sm">
                Go to dashboard
              </Button>
            </Link>
          </div>
        </FormLayout>
      ) : position.closed ? (
        <FormLayout aside={about}>
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            This position isn't taking new applications. Check back later.
          </div>
        </FormLayout>
      ) : !isAuthenticated ? (
        <FormLayout aside={about}>
          <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Sign in to apply for this position.
            </p>
            <SignInLink>
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </SignInLink>
          </div>
        </FormLayout>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormLayout
            aside={
              <>
                {about}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-zinc-950 dark:text-zinc-50">
                      Progress
                    </span>
                    <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                      {answered}/{total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width: `${total ? (answered / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {error && <FormError>{error}</FormError>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  disabled={position.requires_main_server && member === false}
                  className="w-full"
                >
                  Submit Application
                </Button>
              </>
            }
          >
            {position.requires_main_server && <JoinServerCard required />}
            {position.questions.map((q, i) => {
              const value = answers[q.id] ?? "";
              return (
                <FormSection
                  key={q.id}
                  step={i + 1}
                  title={q.question}
                  description={q.paragraph || undefined}
                >
                  {q.short ? (
                    <input
                      id={`q-${q.id}`}
                      aria-label={q.question}
                      placeholder={q.placeholder}
                      value={value}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      maxLength={SHORT_MAX}
                      required
                      className={TEXTAREA_CLASS}
                    />
                  ) : (
                    <>
                      <textarea
                        id={`q-${q.id}`}
                        aria-label={q.question}
                        rows={5}
                        maxLength={PARAGRAPH_MAX}
                        value={value}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        className={`resize-y ${TEXTAREA_CLASS}`}
                        required
                      />
                      <p
                        className={[
                          "mt-1.5 text-right text-xs tabular-nums",
                          value.trim().length >= PARAGRAPH_MIN
                            ? "text-green-600 dark:text-green-400"
                            : "text-zinc-400",
                        ].join(" ")}
                      >
                        {value.length} / {PARAGRAPH_MIN} min
                      </p>
                    </>
                  )}
                </FormSection>
              );
            })}
          </FormLayout>
        </form>
      )}
    </Container>
  );
}

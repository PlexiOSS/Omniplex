"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Markdown } from "@/components/markdown/Markdown";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/apps"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={14} />
          Back to applications
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {position.name}
          </h1>
          {position.closed && <Badge variant="danger">Closed</Badge>}
        </div>

        {position.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {position.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        <Markdown content={position.info} className="mt-5 text-sm" />

        {submitted ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
            <CheckCircle2 size={28} className="mb-3 text-green-500" />
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Application submitted
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              We'll review it and follow up. You can check its status from
              your dashboard any time.
            </p>
            <Link href="/dashboard" className="mt-4">
              <Button variant="secondary" size="sm">
                Go to dashboard
              </Button>
            </Link>
          </div>
        ) : position.closed ? (
          <p className="mt-8 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            This position is currently closed to new applications. Check back
            later.
          </p>
        ) : !isAuthenticated ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              Sign in to apply for this position.
            </p>
            <SignInLink>
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </SignInLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {position.questions.map((q) =>
              q.short ? (
                <Input
                  key={q.id}
                  id={`q-${q.id}`}
                  label={q.question}
                  placeholder={q.placeholder}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  maxLength={SHORT_MAX}
                  required
                />
              ) : (
                <div key={q.id} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`q-${q.id}`}
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    {q.question}
                  </label>
                  {q.paragraph && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                      {q.paragraph}
                    </p>
                  )}
                  <textarea
                    id={`q-${q.id}`}
                    rows={5}
                    maxLength={PARAGRAPH_MAX}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                    required
                  />
                  <p className="text-right text-xs text-zinc-400">
                    {(answers[q.id] ?? "").length} characters (min{" "}
                    {PARAGRAPH_MIN})
                  </p>
                </div>
              ),
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full"
            >
              Submit Application
            </Button>
          </form>
        )}
      </div>
    </Container>
  );
}

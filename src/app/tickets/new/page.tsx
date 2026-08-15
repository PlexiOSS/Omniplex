"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { tickets } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { TicketTopic } from "@/lib/api/types";

const ISSUE_MAX = 200;
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 4000;

export default function NewTicketPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading: authLoading } = useAuth();

  const [topics, setTopics] = useState<TicketTopic[]>([]);
  const [topic, setTopic] = useState("");
  const [issue, setIssue] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tickets.getTopics().then((res) => {
      setTopics(res.topics);
      setTopic((t) => t || res.topics[0]?.id || "");
    });
  }, []);

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <Container className="py-16 text-center">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to open a ticket.
        </p>
        <SignInLink>
          <Button variant="primary" size="sm">
            Sign in
          </Button>
        </SignInLink>
      </Container>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !topic) return;
    if (issue.trim().length < 10) {
      return setError("Give it a short subject line — at least 10 characters.");
    }
    if (message.trim().length < MESSAGE_MIN) {
      return setError(`Explain what's going on — at least ${MESSAGE_MIN} characters.`);
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await tickets.create(
        session.user_id,
        { topic, issue: issue.trim(), message: message.trim() },
        session.token,
      );
      router.push(`/tickets/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to open ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/tickets"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>

        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Open a Ticket
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Topic
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  className={[
                    "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                    topic === t.id
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-400",
                  ].join(" ")}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <Input
            id="issue"
            label="Subject"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Short summary of the issue"
            maxLength={ISSUE_MAX}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="message"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              What&apos;s going on?
            </label>
            <textarea
              id="message"
              rows={6}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include anything staff would need to help — what you expected, what happened instead, and any relevant IDs or links."
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              required
            />
            <p className="text-right text-xs text-zinc-400">
              {message.length}/{MESSAGE_MAX} (min {MESSAGE_MIN})
            </p>
          </div>

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
            Open Ticket
          </Button>
        </form>
      </div>
    </Container>
  );
}

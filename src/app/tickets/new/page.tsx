"use client";

import { ArrowLeft, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FieldLabel,
  FormChecklist,
  FormError,
  FormLayout,
  FormSection,
  TEXTAREA_CLASS,
} from "@/components/forms/FormSection";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
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
      return setError("Give it a short subject line, at least 10 characters.");
    }
    if (message.trim().length < MESSAGE_MIN) {
      return setError(
        `Explain what's going on in at least ${MESSAGE_MIN} characters.`,
      );
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
      setError(
        err instanceof ApiError ? err.message : "Failed to open ticket.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10">
      <Link
        href="/tickets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Back to tickets
      </Link>

      <PageHeader
        icon={LifeBuoy}
        title="Open a Ticket"
        description="Get help from the Omniplex staff team. Replies show up on the ticket and in your notifications."
      />

      <form onSubmit={handleSubmit}>
        <FormLayout
          aside={
            <>
              <FormChecklist
                title="Help us help you"
                items={[
                  "Pick the topic that fits best so the right staff see it.",
                  "Include bot, server or user IDs and any links.",
                  "Say what you expected and what happened instead.",
                  "Don't share passwords, tokens or payment details.",
                ]}
              />
              <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">
                Looking for a quick answer? Try the{" "}
                <Link
                  href="/kb"
                  className="text-accent underline underline-offset-2"
                >
                  knowledge base
                </Link>{" "}
                first.
              </p>

              {error && <FormError>{error}</FormError>}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                Open Ticket
              </Button>
            </>
          }
        >
          <FormSection
            step={1}
            title="Topic"
            description="What do you need help with?"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  aria-pressed={topic === t.id}
                  className={[
                    "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    topic === t.id
                      ? "border-accent bg-accent/5 text-accent ring-1 ring-accent/30"
                      : "border-zinc-200 text-zinc-700 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-300",
                  ].join(" ")}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection
            step={2}
            title="Details"
            description="The more detail, the faster we can help."
          >
            <div className="space-y-4">
              <Input
                id="issue"
                label="Subject"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Short summary of the issue"
                maxLength={ISSUE_MAX}
                required
              />
              <div>
                <FieldLabel
                  htmlFor="message"
                  required
                  count={`${message.length}/${MESSAGE_MAX}`}
                >
                  What&apos;s going on?
                </FieldLabel>
                <textarea
                  id="message"
                  rows={8}
                  maxLength={MESSAGE_MAX}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What you expected, what happened instead, and any relevant IDs or links."
                  className={`resize-y ${TEXTAREA_CLASS}`}
                  required
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  At least {MESSAGE_MIN} characters.
                </p>
              </div>
            </div>
          </FormSection>
        </FormLayout>
      </form>
    </Container>
  );
}

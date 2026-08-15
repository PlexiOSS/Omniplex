import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { getLegalDocuments } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Legal",
  description: "Omniplex's Terms of Service, Privacy Policy, and other policies.",
};

export default function LegalPage() {
  const documents = getLegalDocuments();

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Legal
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Omniplex's Terms of Service, Privacy Policy, and other policies.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl space-y-3">
        {documents.map((doc) => (
          <Link
            key={doc.slug}
            href={`/legal/${doc.slug}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div>
              <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
                {doc.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {doc.description}
              </p>
              {doc.lastUpdated && (
                <p className="mt-2 text-xs font-medium text-zinc-400 dark:text-zinc-600">
                  Last updated {doc.lastUpdated}
                </p>
              )}
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400"
            />
          </Link>
        ))}
      </div>
    </Container>
  );
}

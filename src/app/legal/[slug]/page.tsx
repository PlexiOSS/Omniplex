import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Markdown } from "@/components/markdown/Markdown";
import { getLegalDocument, getLegalDocuments } from "@/lib/legal/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getLegalDocuments().map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDocument(slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function LegalDocumentPage({ params }: Props) {
  const { slug } = await params;
  const doc = getLegalDocument(slug);
  if (!doc) notFound();

  return (
    <Container className="py-10">
      <Link
        href="/legal"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Legal
      </Link>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {doc.title}
        </h1>
        {doc.lastUpdated && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Last updated {doc.lastUpdated}
          </p>
        )}

        <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <Markdown
            content={doc.content}
            className="text-sm text-zinc-700 dark:text-zinc-300"
          />
        </div>
      </div>
    </Container>
  );
}

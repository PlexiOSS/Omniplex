"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AdminPageHeader } from "../AdminPageHeader";

interface EditorPageProps {
  title: string;
  description?: ReactNode;
  onBack: () => void;
  backLabel?: string;
  children: ReactNode;
}

export function EditorPage({
  title,
  description,
  onBack,
  backLabel = "Back",
  children,
}: EditorPageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        {backLabel}
      </button>
      <AdminPageHeader title={title} description={description} />
      <div className="mt-6 max-w-3xl rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </div>
  );
}

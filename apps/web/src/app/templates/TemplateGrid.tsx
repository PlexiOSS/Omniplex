"use client";

import { useState } from "react";
import { ServerTemplateCard } from "@/components/cards/ServerTemplateCard";
import type { ServerTemplate } from "@/lib/api/types";

export function TemplateGrid({
  initialTemplates,
}: {
  initialTemplates: ServerTemplate[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
        <p className="text-sm">No server templates available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <ServerTemplateCard
          key={template.id}
          template={template}
          onDeleted={(id) => setTemplates((t) => t.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  );
}

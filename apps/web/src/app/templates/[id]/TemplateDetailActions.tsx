"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { serverTemplates } from "@/lib/api";

interface TemplateDetailActionsProps {
  templateId: string;
  code: string;
  ownerId: string;
}

export function TemplateDetailActions({
  templateId,
  code,
  ownerId,
}: TemplateDetailActionsProps) {
  const router = useRouter();
  const { session } = useAuth();
  const isOwner = session?.user_id === ownerId;

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteClick() {
    if (!session) return;
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setDeleting(true);
    serverTemplates
      .delete(session.user_id, templateId, session.token)
      .then(() => router.push("/templates"))
      .catch(() => setDeleting(false));
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={`https://discord.com/template/${code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-muted"
      >
        Use Template
        <ExternalLink size={14} />
      </a>
      {isOwner && (
        <Button
          type="button"
          variant={confirming ? "danger" : "secondary"}
          loading={deleting}
          onClick={handleDeleteClick}
        >
          <Trash2 size={14} />
          {confirming ? "Confirm delete?" : "Delete Template"}
        </Button>
      )}
    </div>
  );
}

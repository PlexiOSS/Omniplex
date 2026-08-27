"use client";

import { Modal } from "@/components/ui/Modal";
import { WebhookManager } from "@/components/webhooks/WebhookManager";

interface WebhookModalProps {
  title: string;
  targetType: "bot" | "server" | "team";
  targetId: string;
  authToken: string;
  canManage: boolean;
  canViewLogs: boolean;
  onClose: () => void;
}

export function WebhookModal({
  title,
  targetType,
  targetId,
  authToken,
  canManage,
  canViewLogs,
  onClose,
}: WebhookModalProps) {
  return (
    <Modal open onClose={onClose} title={title}>
      <WebhookManager
        targetType={targetType}
        targetId={targetId}
        authToken={authToken}
        canManage={canManage}
        canViewLogs={canViewLogs}
      />
    </Modal>
  );
}

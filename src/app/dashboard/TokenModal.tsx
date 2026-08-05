"use client";

import { Modal } from "@/components/ui/Modal";
import { TokenManager } from "@/components/sessions/TokenManager";

interface TokenModalProps {
  title: string;
  targetType: "bot" | "server" | "team";
  targetId: string;
  authToken: string;
  myPerms: string[];
  onClose: () => void;
}

export function TokenModal({
  title,
  targetType,
  targetId,
  authToken,
  myPerms,
  onClose,
}: TokenModalProps) {
  return (
    <Modal open onClose={onClose} title={title}>
      <TokenManager
        targetType={targetType}
        targetId={targetId}
        authToken={authToken}
        myPerms={myPerms}
      />
    </Modal>
  );
}

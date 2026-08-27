import { Bot, Server, Smile } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { PackType } from "@/lib/api/types";

const CONFIG: Record<PackType, { label: string; icon: typeof Bot }> = {
  bot: { label: "Bot Pack", icon: Bot },
  server: { label: "Server Pack", icon: Server },
  emoji: { label: "Emoji Pack", icon: Smile },
};

export function PackTypeBadge({ type }: { type: PackType }) {
  const { label, icon: Icon } = CONFIG[type];
  return (
    <Badge variant="info">
      <Icon size={11} />
      {label}
    </Badge>
  );
}

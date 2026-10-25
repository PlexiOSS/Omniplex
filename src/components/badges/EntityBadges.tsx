import { Badge } from "@/components/ui/Badge";
import { badges as badgesApi } from "@/lib/api";
import { badgeColor, badgeIcon } from "@/lib/constants/badgeIcons";

interface EntityBadgesProps {
  targetType: "bot" | "server" | "team";
  targetId: string;
}

export async function EntityBadges({
  targetType,
  targetId,
}: EntityBadgesProps) {
  const data = await badgesApi
    .getForEntity(targetType, targetId)
    .catch(() => null);

  return (data?.badges ?? []).map(({ badge }) => {
    const Icon = badgeIcon(badge.icon);
    return (
      <Badge
        key={badge.id}
        variant={badgeColor(badge.color)}
        title={badge.description || undefined}
      >
        <Icon size={12} />
        {badge.name}
      </Badge>
    );
  });
}

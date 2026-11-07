"use client";

import { bots } from "@omniplex/core/api";
import { botPath, mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { Badge } from "@omniplex/ui/Badge";
import {
  BarChart2,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Megaphone,
  Sparkles,
  Terminal,
  TriangleAlert,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import useSWR from "swr";
import { BotChangelogSection } from "@/components/bots/BotChangelogSection";
import { BotCommandsSection } from "@/components/bots/BotCommandsSection";
import { Container } from "@/components/layout/Container";
import { TokenManager } from "@/components/sessions/TokenManager";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { useAuth } from "@/hooks/useAuth";
import { useEntityPermission } from "@/hooks/useEntityPermission";
import { ManageShell, useSection } from "../../manage/ManageShell";
import { AppearanceSection } from "./AppearanceSection";
import { DangerSection } from "./DangerSection";
import { DetailsSection, type SectionProps } from "./DetailsSection";
import { StatsSection } from "./StatsSection";
import { TeamSection } from "./TeamSection";

const SECTIONS = [
  "details",
  "appearance",
  "commands",
  "changelog",
  "stats",
  "sessions",
  "webhooks",
  "team",
  "danger",
] as const;
type Section = (typeof SECTIONS)[number];

function BotSettings() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const [section, setSection] = useSection(SECTIONS, "details");
  const {
    perms,
    hasPerm,
    loading: permsLoading,
  } = useEntityPermission("bot", params.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/auth/login");
  }, [authLoading, isAuthenticated, router]);

  const token = session?.token;
  const {
    data: bot,
    error,
    mutate,
  } = useSWR(token ? ["manage/bot", params.id] : null, () =>
    bots.getBot(params.id, token),
  );
  const { data: commands } = useSWR(
    token && section === "commands" ? ["manage/bot/commands", params.id] : null,
    () => bots.getCommands(params.id, token),
  );
  const { data: changelogs } = useSWR(
    token && section === "changelog"
      ? ["manage/bot/changelogs", params.id]
      : null,
    () => bots.getChangelogs(params.id, token),
  );

  if (error) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Couldn&apos;t load this bot.{" "}
        <Link
          href="/dashboard?tab=bots"
          className="text-accent hover:underline"
        >
          Back to your bots
        </Link>
      </Container>
    );
  }
  if (!session || !bot || permsLoading) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </Container>
    );
  }

  const canEdit = hasPerm("edit_bots");
  const canDelete = hasPerm("delete_bots");
  if (!canEdit) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        You don&apos;t have permission to manage this bot.{" "}
        <Link
          href={botPath(bot.bot_id, bot.vanity)}
          className="text-accent hover:underline"
        >
          View its page
        </Link>
      </Container>
    );
  }

  const props: SectionProps = {
    bot,
    userId: session.user_id,
    token: session.token,
    onSaved: () => mutate(),
  };

  const groups = [
    {
      label: "Listing",
      items: [
        { key: "details" as Section, label: "Details", icon: FileText },
        { key: "appearance" as Section, label: "Appearance", icon: ImageIcon },
        { key: "commands" as Section, label: "Commands", icon: Terminal },
        { key: "changelog" as Section, label: "Changelog", icon: Megaphone },
        { key: "stats" as Section, label: "Statistics", icon: BarChart2 },
      ],
    },
    {
      label: "Developers",
      items: [
        { key: "sessions" as Section, label: "API sessions", icon: KeyRound },
        { key: "webhooks" as Section, label: "Webhooks", icon: WebhookIcon },
      ],
    },
    {
      label: "Ownership",
      items: [
        { key: "team" as Section, label: "Team", icon: Users },
        ...(canDelete
          ? [
              {
                key: "danger" as Section,
                label: "Danger zone",
                icon: TriangleAlert,
              },
            ]
          : []),
      ],
    },
  ];

  const isLive = bot.type === "approved" || bot.type === "certified";

  return (
    <ManageShell
      backHref="/dashboard?tab=bots"
      backLabel="Your bots"
      name={bot.user.username}
      avatar={mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar)}
      viewHref={botPath(bot.bot_id, bot.vanity)}
      badges={
        <>
          {bot.type === "certified" && (
            <Badge variant="success">Certified</Badge>
          )}
          {bot.premium && <Badge variant="premium">Premium</Badge>}
          {!isLive && (
            <Badge variant={bot.type === "denied" ? "danger" : "warning"}>
              {bot.type === "denied" ? "Denied" : "In review"}
            </Badge>
          )}
          {isLive && !bot.premium && (
            <Link
              href={`/shop/premium?bot=${bot.bot_id}`}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/15"
            >
              <Sparkles size={11} />
              Upgrade
            </Link>
          )}
        </>
      }
      groups={groups}
      active={section}
      onSelect={setSection}
    >
      {section === "details" && <DetailsSection key={bot.bot_id} {...props} />}
      {section === "appearance" && <AppearanceSection {...props} />}
      {section === "commands" &&
        (commands ? (
          <BotCommandsSection
            botId={bot.bot_id}
            initialCommands={commands.commands}
            canEdit
            token={session.token}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ))}
      {section === "changelog" &&
        (changelogs ? (
          <BotChangelogSection
            entityId={bot.bot_id}
            initialChangelogs={changelogs.changelogs}
            canEdit
            token={session.token}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ))}
      {section === "stats" && <StatsSection bot={bot} token={session.token} />}
      {section === "sessions" && (
        <TokenManager
          targetType="bot"
          targetId={bot.bot_id}
          authToken={session.token}
          myPerms={perms}
        />
      )}
      {section === "webhooks" && (
        <WebhookManager
          targetType="bot"
          targetId={bot.bot_id}
          authToken={session.token}
          canManage={hasPerm("manage_webhooks")}
          canViewLogs={hasPerm("view_webhook_logs")}
        />
      )}
      {section === "team" && <TeamSection {...props} />}
      {section === "danger" && canDelete && <DangerSection {...props} />}
    </ManageShell>
  );
}

export default function BotSettingsPage() {
  return (
    <Suspense>
      <BotSettings />
    </Suspense>
  );
}

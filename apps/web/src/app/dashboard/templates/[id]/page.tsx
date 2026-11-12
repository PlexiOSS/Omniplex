"use client";

import { serverTemplates } from "@omniplex/core/api";
import { Badge } from "@omniplex/ui/Badge";
import {
  FileText,
  Image as ImageIcon,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import useSWR from "swr";
import { Container } from "@/components/layout/Container";
import { TemplateIcon } from "@/components/templates/TemplateIcon";
import { useAuth } from "@/hooks/useAuth";
import { ManageShell, useSection } from "../../manage/ManageShell";
import {
  DangerSection,
  DetailsSection,
  IconSection,
  SyncSection,
  type TemplateSectionProps,
} from "./sections";

const SECTIONS = ["details", "icon", "sync", "danger"] as const;
type Section = (typeof SECTIONS)[number];

function message(text: string) {
  return (
    <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
      {text}{" "}
      <Link
        href="/dashboard?tab=templates"
        className="text-accent hover:underline"
      >
        Back to your templates
      </Link>
    </Container>
  );
}

function TemplateSettings() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const [section, setSection] = useSection(SECTIONS, "details");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/auth/login");
  }, [authLoading, isAuthenticated, router]);

  const {
    data: template,
    error,
    mutate,
  } = useSWR(session ? ["manage/template", params.id] : null, () =>
    serverTemplates.getTemplate(params.id),
  );

  if (error) return message("Couldn't load this template.");
  if (!session || !template) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </Container>
    );
  }
  if (template.owner.id !== session.user_id) {
    return message(
      "Only the person who submitted this template can manage it.",
    );
  }

  const props: TemplateSectionProps = {
    template,
    userId: session.user_id,
    token: session.token,
    onSaved: () => mutate(),
  };

  const groups = [
    {
      label: "Template",
      items: [
        { key: "details" as Section, label: "Details", icon: FileText },
        { key: "icon" as Section, label: "Icon", icon: ImageIcon },
        { key: "sync" as Section, label: "Sync", icon: RefreshCw },
      ],
    },
    {
      label: "Ownership",
      items: [
        { key: "danger" as Section, label: "Danger zone", icon: TriangleAlert },
      ],
    },
  ];

  return (
    <ManageShell
      backHref="/dashboard?tab=templates"
      backLabel="Your templates"
      name={template.name}
      icon={
        <TemplateIcon
          templateId={template.id}
          version={template.icon_version}
          name={template.name}
          size={40}
        />
      }
      viewHref={`/templates/${template.id}`}
      badges={
        <>
          {template.nsfw && <Badge variant="danger">NSFW</Badge>}
          {template.unavailable && (
            <Badge variant="danger">Deleted on Discord</Badge>
          )}
          {!template.unavailable && template.out_of_date && (
            <Badge variant="warning">Unsynced changes</Badge>
          )}
        </>
      }
      groups={groups}
      active={section}
      onSelect={setSection}
    >
      {section === "details" && <DetailsSection {...props} />}
      {section === "icon" && <IconSection {...props} />}
      {section === "sync" && <SyncSection {...props} />}
      {section === "danger" && <DangerSection {...props} />}
    </ManageShell>
  );
}

export default function TemplateSettingsPage() {
  return (
    <Suspense>
      <TemplateSettings />
    </Suspense>
  );
}

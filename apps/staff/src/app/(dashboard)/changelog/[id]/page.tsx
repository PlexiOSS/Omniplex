"use client";

import { useParams } from "next/navigation";
import { ChangelogEditorRoute } from "@/app/(dashboard)/changelog/ChangelogEditorRoute";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return <ChangelogEditorRoute id={decodeURIComponent(id)} />;
}

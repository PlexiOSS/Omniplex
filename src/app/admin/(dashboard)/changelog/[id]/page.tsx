"use client";

import { useParams } from "next/navigation";
import { ChangelogEditorRoute } from "../ChangelogEditorRoute";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return <ChangelogEditorRoute id={decodeURIComponent(id)} />;
}

"use client";

import { useParams } from "next/navigation";
import { BadgeEditorRoute } from "@/app/(dashboard)/badges/BadgeEditorRoute";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return <BadgeEditorRoute id={decodeURIComponent(id)} />;
}

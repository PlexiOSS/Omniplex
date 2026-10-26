"use client";

import { useParams } from "next/navigation";
import { PositionEditorRoute } from "../PositionEditorRoute";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return <PositionEditorRoute id={decodeURIComponent(id)} />;
}

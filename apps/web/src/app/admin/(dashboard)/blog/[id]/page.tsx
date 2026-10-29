"use client";

import { useParams } from "next/navigation";
import { BlogEditorRoute } from "../BlogEditorRoute";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return <BlogEditorRoute id={decodeURIComponent(id)} />;
}

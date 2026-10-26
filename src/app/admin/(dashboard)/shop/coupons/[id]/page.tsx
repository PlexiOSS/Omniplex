"use client";

import { useParams } from "next/navigation";
import { CouponEditorRoute } from "../CouponEditorRoute";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return <CouponEditorRoute id={decodeURIComponent(id)} />;
}

"use client";

import { useParams } from "next/navigation";
import { CouponEditorRoute } from "@/app/(dashboard)/shop/coupons/CouponEditorRoute";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return <CouponEditorRoute id={decodeURIComponent(id)} />;
}

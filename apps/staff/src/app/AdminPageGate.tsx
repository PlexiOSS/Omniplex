"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAdmin } from "@/app/AdminContext";
import { findAdminNav } from "@/app/AdminSidebar";
import { useAdminCounts } from "@/app/useAdminCounts";
import { AdminNoAccess } from "@/components/admin/AdminState";

export function AdminPageGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hasPerm } = useAdmin();
  const counts = useAdminCounts();
  const nav = findAdminNav(pathname)?.item;
  const count = nav?.count ? (counts[nav.count] ?? 0) : 0;

  useEffect(() => {
    const label = nav?.label ?? "Staff Panel";
    document.title = `${count > 0 ? `(${count}) ` : ""}${label} | Omniplex Staff`;
  }, [nav?.label, count]);

  if (nav?.perm && !hasPerm(nav.perm)) return <AdminNoAccess perm={nav.perm} />;

  return <>{children}</>;
}

import { AdminWarnings } from "@/app/(dashboard)/AdminWarnings";
import { AdminGate } from "@/app/AdminContext";
import { AdminMobileNav, AdminSidebar } from "@/app/AdminSidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <AdminWarnings />
      <div className="flex w-full flex-1">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminMobileNav />
          {children}
        </div>
      </div>
    </AdminGate>
  );
}

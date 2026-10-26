import { AdminGate } from "../AdminContext";
import { AdminMobileNav, AdminSidebar } from "../AdminSidebar";
import { AdminWarnings } from "./AdminWarnings";

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

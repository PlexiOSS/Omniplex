import { AdminGate } from "../AdminContext";
import { AdminWarnings } from "./AdminWarnings";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <AdminWarnings />
      <main className="flex-1">{children}</main>
    </AdminGate>
  );
}

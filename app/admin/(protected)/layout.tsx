import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic="force-dynamic";

export default async function ProtectedAdminLayout({children}:{children:React.ReactNode}){
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}

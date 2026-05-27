import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 lg:flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

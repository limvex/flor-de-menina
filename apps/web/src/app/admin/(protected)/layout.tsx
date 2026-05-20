import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';
import { requireAdmin } from '@/lib/admin/require-admin';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  return (
    <div className="light h-dvh overflow-hidden">
      <AdminShell user={user}>{children}</AdminShell>
      <Toaster position="top-right" theme="light" richColors />
    </div>
  );
}

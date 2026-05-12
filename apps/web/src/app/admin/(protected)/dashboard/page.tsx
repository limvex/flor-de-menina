import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DashboardClient } from './dashboard-client';

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Dashboard" description="Visão geral do seu e-commerce." />
      <DashboardClient />
    </div>
  );
}

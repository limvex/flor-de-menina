import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default function DashboardPage() {
  return (
    <>
      <AdminPageHeader title="Dashboard" description="Visão geral do seu e-commerce." />
      <EmptyState
        icon={LayoutDashboard}
        title="Em construção"
        description="O dashboard com métricas estará disponível em breve."
      />
    </>
  );
}

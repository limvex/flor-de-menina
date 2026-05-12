import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminReviewsClient } from './admin-reviews-client';

export default function AdminReviewsPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Reviews"
        description="Modere avaliações com foto enviadas pelas clientes."
      />
      <AdminReviewsClient />
    </div>
  );
}

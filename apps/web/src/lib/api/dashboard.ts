import { api } from './client';

export type DashboardPreset = 'today' | '7d' | '30d' | 'custom';

export interface DashboardSummary {
  period: { preset: string; from: string; to: string };
  kpis: { revenue: number; ordersCount: number; averageTicket: number };
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { productId: string; name: string; unitsSold: number; revenue: number }[];
  recentOrders: {
    id: string;
    number: string;
    status: string;
    total: number;
    createdAt: string;
    customerName: string | null;
    customerEmail: string | null;
  }[];
  alerts: {
    lowStockCount: number;
    pendingReviewsCount: number;
    unattendedOrdersCount: number;
  };
}

function summaryPath(preset: DashboardPreset, custom?: { from: string; to: string }): string {
  const qs = new URLSearchParams();
  qs.set('preset', preset);
  if (preset === 'custom' && custom) {
    qs.set('from', custom.from);
    qs.set('to', custom.to);
  }
  return `/admin/dashboard/summary?${qs.toString()}`;
}

export const dashboardApi = {
  getSummary: (preset: DashboardPreset, custom?: { from: string; to: string }) =>
    api.get<DashboardSummary>(summaryPath(preset, custom)),
};

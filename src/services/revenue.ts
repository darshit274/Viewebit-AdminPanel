import api from './api';

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export interface RevenueStats {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  total_revenue: number;
  monthly_revenue: number;
  revenue_trend: RevenueTrendPoint[];
}

export interface RevenueStatsFilters {
  branch_id?: number;
  department_id?: number;
  date_from?: string;
  date_to?: string;
}

export const revenueService = {
  getStats: async (filters: RevenueStatsFilters = {}): Promise<{ success: boolean; data: RevenueStats }> => {
    const queryParams = new URLSearchParams();
    if (filters.branch_id) queryParams.append('branch_id', filters.branch_id.toString());
    if (filters.department_id) queryParams.append('department_id', filters.department_id.toString());
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);

    const response = await api.get(`/admin/subscriptions/stats?${queryParams}`);
    return response.data;
  },

  exportRevenue: async (): Promise<Blob> => {
    const response = await api.get('/admin/subscriptions/export', { responseType: 'blob' });
    return response.data;
  },

  exportEnrollments: async (filters: { status?: string; branch_id?: number; department_id?: number } = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.branch_id) queryParams.append('branch_id', filters.branch_id.toString());
    if (filters.department_id) queryParams.append('department_id', filters.department_id.toString());

    const response = await api.get(`/admin/reports/enrollments/export?${queryParams}`, { responseType: 'blob' });
    return response.data;
  },
};

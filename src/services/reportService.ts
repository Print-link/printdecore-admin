import api from '../config/api';
import type { RevenueReport } from '../types';

export const reportService = {
  getRevenue: async (params?: { branchId?: string; startDate?: string; endDate?: string; period?: string }) => {
    const response = await api.get<{ success: boolean; data: RevenueReport }>('/manager/dashboard/revenue-report', { params });
    return response.data.data;
  },
};

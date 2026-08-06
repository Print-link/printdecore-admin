import api from '../config/api';
import type { ActivityLog } from '../types';

export const activityLogService = {
  getAll: async (params?: { page?: number; limit?: number; userId?: string; action?: string; entityType?: string }) => {
    const response = await api.get<{ success: boolean; data: ActivityLog[]; count: number }>('/activity-logs', { params });
    return {
      logs: response.data.data || [],
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: response.data.count || 0,
        itemsPerPage: params?.limit || 20
      }
    };
  },
};

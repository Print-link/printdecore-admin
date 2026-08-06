import api from '../config/api';
import type { Clerk } from '../types';

export const clerkService = {
  getAll: async (params?: { isActive?: boolean; page?: number; limit?: number; search?: string; adminId?: string }) => {
    const response = await api.get<{ success: boolean; data: Clerk[]; count: number }>('/clerks', { params });
    return {
      clerks: response.data.data,
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: response.data.count,
        itemsPerPage: params?.limit || 10
      }
    };
  },
};

import api from '../config/api';
import type { Client } from '../types';

// Clients (Customers)
export const clientService = {
  getAll: async (params?: { isActive?: boolean; page?: number; limit?: number; search?: string }) => {
    const response = await api.get<{ success: boolean; data: Client[]; count: number }>('/customers', { params });
    return {
      clients: response.data.data,
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: response.data.count,
        itemsPerPage: params?.limit || 10
      }
    };
  },
};

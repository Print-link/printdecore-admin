import api from '../config/api';
import type { SupportTicket } from '../types';

export const supportService = {
  getAll: async (params?: { page?: number; limit?: number; adminId?: string; clientId?: string; jobId?: string; status?: string }) => {
    const response = await api.get<{ success: boolean; data: SupportTicket[]; count: number }>('/support-tickets', { params });
    return {
      supportTickets: response.data.data,
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: response.data.count,
        itemsPerPage: params?.limit || 10
      }
    };
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: SupportTicket }>(`/support-tickets/${id}`);
    return response.data.data;
  },
  update: async (id: string, data: { message?: string; response?: string }) => {
    const response = await api.put<{ success: boolean; data: SupportTicket }>(`/support-tickets/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/support-tickets/${id}`);
    return response.data;
  },
};

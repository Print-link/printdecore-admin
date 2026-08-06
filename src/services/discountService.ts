import api from '../config/api';
import type { Discount } from '../types';

export const discountService = {
  getAll: async (params?: { scope?: string; isActive?: string }) => {
    const response = await api.get<{ success: boolean; data: Discount[] }>('/discounts', { params });
    return response.data.data || [];
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Discount }>(`/discounts/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Discount>) => {
    const response = await api.post<{ success: boolean; data: Discount }>('/discounts', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<Discount>) => {
    const response = await api.put<{ success: boolean; data: Discount }>(`/discounts/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/discounts/${id}`);
    return response.data;
  },
  assign: async (id: string, data: { customerIds?: string[]; waitlistIds?: string[]; emails?: string[] }) => {
    const response = await api.post<{ success: boolean; data: { assigned: number; total: number } }>(`/discounts/${id}/assign`, data);
    return response.data.data;
  },
  getAssignments: async (id: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/discounts/${id}/assignments`);
    return response.data.data || [];
  },
  removeAssignment: async (assignmentId: string) => {
    const response = await api.delete<{ success: boolean }>(`/discounts/assignments/${assignmentId}`);
    return response.data;
  },
};

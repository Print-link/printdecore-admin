import api from '../config/api';
import type { WaitlistEntry } from '../types';

export const waitlistService = {
  getAll: async (params?: { userType?: string; country?: string }) => {
    const response = await api.get<{ success: boolean; data: WaitlistEntry[] }>('/waitlist', { params });
    return response.data.data || [];
  },
  getCount: async (params?: { userType?: string; country?: string }) => {
    const response = await api.get<{ success: boolean; data: { count: number } }>('/waitlist/count', { params });
    return response.data.data.count;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/waitlist/${id}`);
    return response.data;
  },
};

import api from '../config/api';
import type { Plan, Subscription } from '../types';

export const billingService = {
  getPlans: async () => {
    const response = await api.get<{ success: boolean; data: Plan[] }>('/billing/plans');
    return response.data.data;
  },
  updatePlan: async (planId: string, data: Partial<Plan>) => {
    const response = await api.put<{ success: boolean; data: Plan }>(`/billing/admin/plans/${planId}`, data, {
      headers: { 'x-admin-key': localStorage.getItem('platformAdminKey') || '' }
    });
    return response.data.data;
  },
  getSubscriptions: async () => {
    const response = await api.get<{ success: boolean; data: Subscription[] }>('/billing/admin/subscriptions', {
      headers: { 'x-admin-key': localStorage.getItem('platformAdminKey') || '' }
    });
    return response.data.data;
  },
};

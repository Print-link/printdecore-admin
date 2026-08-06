import api from '../config/api';
import type { Order, OrderStatus } from '../types';

export const orderService = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; branchId?: string; search?: string }) => {
    const response = await api.get<{ success: boolean; data: Order[]; count: number }>('/orders', { params });
    let orders = response.data.data || [];
    const totalItems = response.data.count || orders.length;
    const currentPage = params?.page || 1;
    const itemsPerPage = params?.limit || 10;

    return {
      orders,
      pagination: { currentPage, totalPages: Math.ceil(totalItems / itemsPerPage), totalItems, itemsPerPage }
    };
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return response.data.data;
  },
  updateStatus: async (id: string, status: OrderStatus, note?: string) => {
    const response = await api.put<{ success: boolean; data: Order }>(`/orders/${id}`, { status, note });
    return response.data.data;
  },
  assignVendor: async (id: string, vendorId: string) => {
    const response = await api.patch<{ success: boolean; data: Order }>(`/orders/${id}/assign-vendor`, { vendorId });
    return response.data.data;
  },
  reassignBranch: async (id: string, branchId: string) => {
    const response = await api.patch<{ success: boolean; data: Order }>(`/orders/${id}/reassign-branch`, { branchId });
    return response.data.data;
  },
  updateNotes: async (id: string, note: string) => {
    const response = await api.patch<{ success: boolean; data: Order }>(`/orders/${id}/notes`, { note });
    return response.data.data;
  },
  getTimeline: async (id: string) => {
    const response = await api.get<{ success: boolean; data: { id: string; status: string; note?: string; createdAt: string }[] }>(`/orders/${id}/timeline`);
    return response.data.data;
  },
};

// Quotations — complex/custom orders awaiting an ops-prepared price
export interface Quotation {
  id: string;
  orderId: string;
  kind: 'standard' | 'complex';
  amount?: number;
  aiSummary?: string;
  preparedBy?: string;
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  sentAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const quotationService = {
  getAll: async (status?: Quotation['status']) => {
    const response = await api.get<{ success: boolean; data: Quotation[] }>('/quotations', { params: status ? { status } : undefined });
    return response.data.data || [];
  },
  send: async (id: string, amount: number) => {
    const response = await api.patch<{ success: boolean; data: Quotation }>(`/quotations/${id}/send`, { amount });
    return response.data.data;
  },
};

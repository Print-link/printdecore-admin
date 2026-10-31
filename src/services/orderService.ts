import api from '../config/api';
import type { Order, OrderStatus, PrintRequest } from '../types';

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
  /** `estimatedCompletionTime` is what the customer's "received, ready by …" message quotes — send it with RECEIVED. */
  updateStatus: async (id: string, status: OrderStatus, note?: string, estimatedCompletionTime?: string) => {
    const response = await api.put<{ success: boolean; data: Order }>(`/orders/${id}`, { status, note, estimatedCompletionTime });
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
  // Enrichment from the backend's queue query
  orderStatus?: OrderStatus;
  customerName?: string;
  customerEmail?: string;
  /** Set when the order came from a Print Assistance request. */
  printRequestId?: string;
  requestNumber?: string;
  serviceName?: string;
  /** The catalog's instant estimate, if the service has one — a starting point, never charged directly. */
  referencePrice?: number;
}

export const quotationService = {
  getAll: async (status?: Quotation['status'], orderId?: string) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (orderId) params.orderId = orderId;
    const response = await api.get<{ success: boolean; data: Quotation[] }>('/quotations', {
      params: Object.keys(params).length ? params : undefined,
    });
    return response.data.data || [];
  },
  send: async (id: string, amount: number) => {
    const response = await api.patch<{ success: boolean; data: Quotation }>(`/quotations/${id}/send`, { amount });
    return response.data.data;
  },
};

// Print Assistance requests — the structured spec behind a quote-on-request order
export const printRequestService = {
  getByOrderId: async (orderId: string) => {
    const response = await api.get<{ success: boolean; data: PrintRequest[] }>('/print-requests', { params: { orderId } });
    return response.data.data?.[0] ?? null;
  },
};

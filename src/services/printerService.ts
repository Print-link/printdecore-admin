import api from '../config/api';
import type { PrinterListing, PrinterOrder, PrinterOrderStatus } from '../types';

// Printer sales catalogue
export const printerListingService = {
  getAll: async (params?: { isActive?: boolean; limit?: number; offset?: number }) => {
    const response = await api.get<{ success: boolean; data: PrinterListing[]; total: number }>('/printer-listings', { params });
    return { listings: response.data.data || [], total: response.data.total ?? (response.data.data || []).length };
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: PrinterListing }>(`/printer-listings/${id}`);
    return response.data.data;
  },
  create: async (data: FormData) => {
    const response = await api.post<{ success: boolean; data: PrinterListing }>('/printer-listings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  update: async (id: string, data: FormData) => {
    const response = await api.put<{ success: boolean; data: PrinterListing }>(`/printer-listings/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/printer-listings/${id}`);
    return response.data;
  },
};

// Printer purchase orders — placed by customers against the catalogue above
export const printerOrderService = {
  getAll: async (params?: { status?: PrinterOrderStatus; limit?: number; offset?: number }) => {
    const response = await api.get<{ success: boolean; data: PrinterOrder[]; total: number }>('/printer-orders', { params });
    return { orders: response.data.data || [], total: response.data.total ?? (response.data.data || []).length };
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: PrinterOrder }>(`/printer-orders/${id}`);
    return response.data.data;
  },
  updateStatus: async (id: string, status: PrinterOrderStatus) => {
    const response = await api.patch<{ success: boolean; data: PrinterOrder }>(`/printer-orders/${id}/status`, { status });
    return response.data.data;
  },
};

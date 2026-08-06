import api from '../config/api';
import type { Branch, BranchDetailResponse } from '../types';

export const branchService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<{ success: boolean; data: Branch[]; count: number }>('/branches');
    let branches = response.data.data || [];

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      branches = branches.filter(b =>
        b.name.toLowerCase().includes(searchLower) ||
        b.branchEmailAddress?.toLowerCase().includes(searchLower) ||
        b.phoneNumber?.includes(searchLower)
      );
    }

    const totalItems = branches.length;
    const currentPage = params?.page || 1;
    const itemsPerPage = params?.limit || 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBranches = branches.slice(startIndex, startIndex + itemsPerPage);

    return {
      branches: paginatedBranches,
      pagination: { currentPage, totalPages: Math.ceil(totalItems / itemsPerPage), totalItems, itemsPerPage }
    };
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: BranchDetailResponse }>(`/branches/${id}`);
    return response.data.data;
  },
  create: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Branch }>('/branches', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
    return response.data.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put<{ success: boolean; data: Branch }>(`/branches/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/branches/${id}`);
    return response.data;
  }
};

// Locations — created separately from a branch, then linked back via branch_id
export const locationService = {
  create: async (data: {
    branch_id: string;
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }) => {
    const response = await api.post<{ success: boolean; data: { id: string } }>('/locations', data);
    return response.data.data;
  },
  update: async (id: string, data: { address?: string; latitude?: number; longitude?: number }) => {
    const response = await api.put<{ success: boolean; data: { id: string } }>(`/locations/${id}`, data);
    return response.data.data;
  },
};

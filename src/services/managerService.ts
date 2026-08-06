import api from '../config/api';
import type { User, Manager } from '../types';

// Users (Managers in backend) — legacy naming kept alongside `managerService` below;
// both talk to the same /managers resource but return different shapes for their own callers.
export const userService = {
  getAll: async (params?: { role?: string; isActive?: boolean; page?: number; limit?: number; search?: string }) => {
    const response = await api.get<{ success: boolean; data: { users: User[]; pagination: any } }>(
      '/managers',
      { params }
    );
    return {
      users: response.data.data,
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: (response.data as any).count || 0,
        itemsPerPage: params?.limit || 10
      }
    };
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: User }>(`/managers/${id}`);
    return response.data.data;
  },
  create: async (data: { email: string; name: string; phone: string; password: string; role: string }) => {
    const [firstName, ...lastNameParts] = data.name.split(' ');
    const lastName = lastNameParts.join(' ');
    const createResponse = await api.post<{ success: boolean; data: { manager: User; token: string } }>(
      '/auth/register',
      { email: data.email, firstName: firstName || 'Admin', lastName: lastName || 'User', password: data.password, phoneNumber: data.phone }
    );
    return createResponse.data.data.manager;
  },
  update: async (id: string, data: Partial<User>) => {
    const response = await api.put<{ success: boolean; data: User }>(`/managers/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; data: User }>(`/managers/${id}`);
    return response.data;
  },
  setupBusinessSubaccount: async (userId: string, paystackSubaccountCode: string) => {
    const response = await api.put<{ success: boolean; data: User }>(`/managers/${userId}`, { paystackSubaccountCode });
    return { success: true, data: { admin: response.data.data }, message: "Subaccount updated" };
  },
};

export const managerService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<{ success: boolean; data: Manager[]; count: number }>('/managers');
    let managers = response.data.data || [];

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      managers = managers.filter(m =>
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower)
      );
    }

    const totalItems = managers.length;
    const currentPage = params?.page || 1;
    const itemsPerPage = params?.limit || 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedManagers = managers.slice(startIndex, startIndex + itemsPerPage);

    return {
      managers: paginatedManagers,
      pagination: { currentPage, totalPages: Math.ceil(totalItems / itemsPerPage), totalItems, itemsPerPage }
    };
  },
  create: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Manager }>('/auth/register', data);
    return response.data.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put<{ success: boolean; data: Manager }>(`/managers/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/managers/${id}`);
    return response.data;
  }
};

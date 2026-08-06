import api from '../config/api';
import type { Role, Permission } from '../types';

export const roleService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: Role[] }>('/roles');
    return response.data.data;
  },
  create: async (data: Partial<Role>) => {
    const response = await api.post<{ success: boolean; data: Role }>('/roles', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<Role>) => {
    const response = await api.put<{ success: boolean; data: Role }>(`/roles/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/roles/${id}`);
    return response.data;
  },
};

export const permissionService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: Permission[] }>('/permissions');
    return response.data.data;
  },
};

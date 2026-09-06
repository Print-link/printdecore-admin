import api from '../config/api';
import type { Client } from '../types';

// The backend's raw customer row — mapped into the dashboard's `Client` shape below.
interface BackendCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
  isActive?: boolean;
  lastLogin?: string;
  lastLocation?: Client['lastLocation'];
  createdAt: string;
  updatedAt: string;
}

const toClient = (c: BackendCustomer): Client => ({
  _id: c.id,
  email: c.email,
  fullName: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
  phoneNumber: c.phoneNumber,
  isActive: c.isActive ?? true,
  lastLogin: c.lastLogin,
  lastLocation: c.lastLocation,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

// Clients (Customers)
export const clientService = {
  getAll: async (params?: { isActive?: boolean; page?: number; limit?: number; search?: string }) => {
    const response = await api.get<{ success: boolean; data: BackendCustomer[]; count: number }>('/customers', { params });
    return {
      clients: (response.data.data || []).map(toClient),
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: response.data.count,
        itemsPerPage: params?.limit || 10
      }
    };
  },
};

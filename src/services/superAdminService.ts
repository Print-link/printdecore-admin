import axios from 'axios';
import api from '../config/api';
import type { 
  SuperAdmin, 
  User, 
  Clerk, 
  Client, 
  SupportTicket,
  DashboardStats,
  Branch,
  Manager
} from '../types';

const SUPERADMIN_URL =  'http://localhost:5000/api';

// Auth - Kept as is for separate service, or placeholder if needed.
// If the backend doesn't support superadmin login, this might fail unless pointing to a separate service.
export const superAdminAuth = {
  login: async (email: string, password: string) => {
    // Assuming this points to the separate service or needs to change to manager login if aligned
    const response = await axios.post(
      `${SUPERADMIN_URL}/superadmin/login`,
      { email, password }
    );
    return response.data;
  },
  
  register: async (email: string, password: string, name: string) => {
    const response = await api.post<{ success: boolean; data: { superAdmin: SuperAdmin; token: string } }>(
      '/superadmin/register',
      { email, password, name }
    );
    return response.data;
  },
};

// Dashboard Stats - Kept as is or mapped to manager stats if appropriate?
// Since SuperAdmin is separate, we keep this pointing to /superadmin/stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>('/superadmin/stats');
  return response.data.data;
};

// Users (Managers in Paper-Link_Backend)
export const userService = {
  getAll: async (params?: { role?: string; isActive?: boolean; page?: number; limit?: number; search?: string }) => {
    // Map to /managers endpoint
    const response = await api.get<{ success: boolean; data: { users: User[]; pagination: any } }>(
      '/managers',
      { params }
    );
    // Transform backend response if needed. Backend returns User[] directly inside data usually?
    // Let's assume standard wrapper: { success: true, data: User[] }
    // But getAll usually returns list.
    // Let's check managerController.getAll... it returns `res.status(200).json({ success: true, count: managers.length, data: managers });`
    // So we need to adapt the response structure match.
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
    const response = await api.get<{ success: boolean; data: User }>(
      `/managers/${id}`
    );
    return response.data.data;
  },
  
  create: async (data: { email: string; name: string; phone: string; password: string; role: string }) => {
    // Splits name into first and last
    const [firstName, ...lastNameParts] = data.name.split(' ');
    const lastName = lastNameParts.join(' ');

    const createResponse = await api.post<{ success: boolean; data: { manager: User; token: string } }>(
      '/auth/register',
      {
        email: data.email,
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        password: data.password,
        phoneNumber: data.phone
      }
    );
    return createResponse.data.data.manager;
  },
  
  update: async (id: string, data: Partial<User>) => {
    const response = await api.put<{ success: boolean; data: User }>(
      `/managers/${id}`,
      data
    );
    return response.data.data;
  },
  
  delete: async (id: string) => {
    // Check if delete endpoint exists for managers
    const response = await api.delete<{ success: boolean; data: User }>(
      `/managers/${id}`
    );
    return response.data;
  },
  
  setupBusinessSubaccount: async (userId: string, paystackSubaccountCode: string) => {
    // This looks custom. If not in backend, might need to implement or skip.
    // Assuming backend specific route or update manager
     const response = await api.put<{ success: boolean; data: User }>(
      `/managers/${userId}`,
      { paystackSubaccountCode } // Assuming field exists in manager update
    );
    return { success: true, data: { admin: response.data.data }, message: "Subaccount updated" };
  },
};

// Clerks
export const clerkService = {
  getAll: async (params?: { isActive?: boolean; page?: number; limit?: number; search?: string; adminId?: string }) => {
    const response = await api.get<{ success: boolean; data: Clerk[]; count: number }>(
      '/clerks',
      { params }
    );
    return {
        clerks: response.data.data,
        pagination: {
            currentPage: params?.page || 1,
            totalPages: 1,
            totalItems: response.data.count,
            itemsPerPage: params?.limit || 10
        }
    };
  },
};

// Clients (Customers)
export const clientService = {
  getAll: async (params?: { isActive?: boolean; page?: number; limit?: number; search?: string }) => {
    const response = await api.get<{ success: boolean; data: Client[]; count: number }>(
      '/customers',
      { params }
    );
    return {
        clients: response.data.data,
        pagination: {
            currentPage: params?.page || 1,
            totalPages: 1,
            totalItems: response.data.count,
            itemsPerPage: params?.limit || 10
        }
    };
  },
};

// Support Tickets - Pointing to NEW route /api/support-tickets
export const supportService = {
  getAll: async (params?: { page?: number; limit?: number; adminId?: string; clientId?: string; jobId?: string; status?: string }) => {
    const response = await api.get<{ success: boolean; data: SupportTicket[]; count: number }>(
      '/support-tickets',
      { params }
    );
    return {
        supportTickets: response.data.data,
        pagination: {
            currentPage: params?.page || 1,
            totalPages: 1,
            totalItems: response.data.count,
            itemsPerPage: params?.limit || 10
        }
    };
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: SupportTicket }>(
      `/support-tickets/${id}`
    );
    return response.data.data;
  },
  
  update: async (id: string, data: { message?: string; response?: string }) => {
    const response = await api.put<{ success: boolean; data: SupportTicket }>(
      `/support-tickets/${id}`,
      data
    );
    return response.data.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(
      `/support-tickets/${id}`
    );
    return response.data;
  },
};

// Branches
export const branchService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    // Determine if we need to filter client-side or if backend supports it.
    // Backend `getAll` doesn't seem to take params based on controller code provided earlier, 
    // it just does `branchModel.findAll()`.
    // So we fetch all and paginate client-side in the service or component.
    // Let's return all data and let the component handle slicing, or slice here.
    const response = await api.get<{ success: boolean; data: Branch[]; count: number }>(
      '/branches'
    );
    
    let branches = response.data.data || [];
    
    // Client-side filtering
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
    
    // Client-side pagination if backend doesn't support it
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBranches = branches.slice(startIndex, startIndex + itemsPerPage);

    return {
        branches: paginatedBranches,
        pagination: {
            currentPage,
            totalPages: Math.ceil(totalItems / itemsPerPage),
            totalItems,
            itemsPerPage
        }
    };
  },

  create: async (data: any) => {
    // Data might contain file, so we might need FormData if image is present
    const response = await api.post<{ success: boolean; data: Branch }>(
      '/branches',
      data,
      {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      }
    );
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<{ success: boolean; data: Branch }>(
      `/branches/${id}`,
      data, 
      {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      }
    );
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(
      `/branches/${id}`
    );
    return response.data;
  }
};

// Managers
export const managerService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<{ success: boolean; data: Manager[]; count: number }>(
      '/managers' // Assuming backend endpoint is /managers based on request "query all manager"
    );
    
    // If backend doesn't paginate, we do it here same as branches
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
        pagination: {
            currentPage,
            totalPages: Math.ceil(totalItems / itemsPerPage),
            totalItems,
            itemsPerPage
        }
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


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
  Manager,
  Plan,
  Subscription,
  Order,
  ActivityLog,
  Role,
  Permission,
  RevenueReport,
} from '../types';

const SUPERADMIN_URL = 'http://localhost:5000/api';

// Auth
export const superAdminAuth = {
  login: async (email: string, password: string) => {
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

// Dashboard Stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>('/superadmin/stats');
  return response.data.data;
};

// Users (Managers in backend)
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

// Clerks
export const clerkService = {
  getAll: async (params?: { isActive?: boolean; page?: number; limit?: number; search?: string; adminId?: string }) => {
    const response = await api.get<{ success: boolean; data: Clerk[]; count: number }>('/clerks', { params });
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
    const response = await api.get<{ success: boolean; data: Client[]; count: number }>('/customers', { params });
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

// Support Tickets
export const supportService = {
  getAll: async (params?: { page?: number; limit?: number; adminId?: string; clientId?: string; jobId?: string; status?: string }) => {
    const response = await api.get<{ success: boolean; data: SupportTicket[]; count: number }>('/support-tickets', { params });
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
    const response = await api.get<{ success: boolean; data: SupportTicket }>(`/support-tickets/${id}`);
    return response.data.data;
  },
  update: async (id: string, data: { message?: string; response?: string }) => {
    const response = await api.put<{ success: boolean; data: SupportTicket }>(`/support-tickets/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/support-tickets/${id}`);
    return response.data;
  },
};

// Branches
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

// Managers
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

// --- New services for backend features ---

// Billing / Plans
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

// Orders
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
};

// Activity Logs
export const activityLogService = {
  getAll: async (params?: { page?: number; limit?: number; userId?: string; action?: string; entityType?: string }) => {
    const response = await api.get<{ success: boolean; data: ActivityLog[]; count: number }>('/activity-logs', { params });
    return {
      logs: response.data.data || [],
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: response.data.count || 0,
        itemsPerPage: params?.limit || 20
      }
    };
  },
};

// Roles & Permissions
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

// Revenue Reports
export const reportService = {
  getRevenue: async (params?: { branchId?: string; startDate?: string; endDate?: string; period?: string }) => {
    const response = await api.get<{ success: boolean; data: RevenueReport }>('/manager/dashboard/revenue-report', { params });
    return response.data.data;
  },
};

// WhatsApp
export const whatsappAdminService = {
  getConnections: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/whatsapp/admin/connections', {
      headers: { 'x-admin-key': localStorage.getItem('platformAdminKey') || '' }
    });
    return response.data.data || [];
  },
  getBroadcasts: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<{ success: boolean; data: any[]; count: number }>('/whatsapp/features/broadcasts', { params });
    return {
      broadcasts: response.data.data || [],
      pagination: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: response.data.count || 0,
        itemsPerPage: params?.limit || 10,
      }
    };
  },
};

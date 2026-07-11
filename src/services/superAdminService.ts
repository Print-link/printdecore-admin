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
  OrderStatus,
  ActivityLog,
  Role,
  Permission,
  RevenueReport,
  ServiceCategory,
  ServiceSubCategory,
  ServiceTemplate,
  PricingFormula,
} from '../types';

// Auth
export const superAdminAuth = {
  login: async (email: string, password: string) => {
    const response = await api.post<{ success: boolean; data: { superAdmin: SuperAdmin; token: string } }>(
      '/superadmin/login',
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
  updateStatus: async (id: string, status: OrderStatus, note?: string) => {
    const response = await api.put<{ success: boolean; data: Order }>(`/orders/${id}`, { status, note });
    return response.data.data;
  },
  assignVendor: async (id: string, vendorId: string) => {
    const response = await api.patch<{ success: boolean; data: Order }>(`/orders/${id}/assign-vendor`, { vendorId });
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

// Discounts
export const discountService = {
  getAll: async (params?: { scope?: string; isActive?: string }) => {
    const response = await api.get<{ success: boolean; data: import('../types').Discount[] }>('/discounts', { params });
    return response.data.data || [];
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: import('../types').Discount }>(`/discounts/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<import('../types').Discount>) => {
    const response = await api.post<{ success: boolean; data: import('../types').Discount }>('/discounts', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<import('../types').Discount>) => {
    const response = await api.put<{ success: boolean; data: import('../types').Discount }>(`/discounts/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/discounts/${id}`);
    return response.data;
  },
  assign: async (id: string, data: { customerIds?: string[]; waitlistIds?: string[]; emails?: string[] }) => {
    const response = await api.post<{ success: boolean; data: { assigned: number; total: number } }>(`/discounts/${id}/assign`, data);
    return response.data.data;
  },
  getAssignments: async (id: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/discounts/${id}/assignments`);
    return response.data.data || [];
  },
  removeAssignment: async (assignmentId: string) => {
    const response = await api.delete<{ success: boolean }>(`/discounts/assignments/${assignmentId}`);
    return response.data;
  },
};

// Waitlist
export const waitlistService = {
  getAll: async (params?: { userType?: string; country?: string }) => {
    const response = await api.get<{ success: boolean; data: import('../types').WaitlistEntry[] }>('/waitlist', { params });
    return response.data.data || [];
  },
  getCount: async (params?: { userType?: string; country?: string }) => {
    const response = await api.get<{ success: boolean; data: { count: number } }>('/waitlist/count', { params });
    return response.data.data.count;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/waitlist/${id}`);
    return response.data;
  },
};

// Blog
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  authorName: string;
  readTime: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const blogService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: BlogPost[]; count: number }>('/blog');
    return response.data.data || [];
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: BlogPost }>(`/blog/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<BlogPost>) => {
    const response = await api.post<{ success: boolean; data: BlogPost }>('/blog', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<BlogPost>) => {
    const response = await api.put<{ success: boolean; data: BlogPost }>(`/blog/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/blog/${id}`);
    return response.data;
  },
};

// Service Catalogue — Categories, Sub-categories, Service Templates, Pricing Formulas
export const categoryService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: ServiceCategory[] }>('/categories');
    return response.data.data || [];
  },
  create: async (data: FormData) => {
    const response = await api.post<{ success: boolean; data: ServiceCategory }>('/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  update: async (id: string, data: FormData) => {
    const response = await api.put<{ success: boolean; data: ServiceCategory }>(`/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/categories/${id}`);
    return response.data;
  },
};

export const subCategoryService = {
  getAll: async (categoryId?: string) => {
    const response = await api.get<{ success: boolean; data: ServiceSubCategory[] }>('/sub-categories', {
      params: categoryId ? { categoryId } : undefined,
    });
    return response.data.data || [];
  },
  create: async (data: FormData) => {
    const response = await api.post<{ success: boolean; data: ServiceSubCategory }>('/sub-categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  update: async (id: string, data: FormData) => {
    const response = await api.put<{ success: boolean; data: ServiceSubCategory }>(`/sub-categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/sub-categories/${id}`);
    return response.data;
  },
};

export const pricingFormulaService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: PricingFormula[] }>('/pricing-formulas');
    return response.data.data || [];
  },
};

export const serviceTemplateService = {
  getAll: async (subCategoryId?: string) => {
    const response = await api.get<{ success: boolean; data: ServiceTemplate[] }>('/service-templates', {
      params: subCategoryId ? { subCategoryId } : undefined,
    });
    return response.data.data || [];
  },
  create: async (data: Partial<ServiceTemplate>) => {
    const response = await api.post<{ success: boolean; data: ServiceTemplate }>('/service-templates', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<ServiceTemplate>) => {
    const response = await api.put<{ success: boolean; data: ServiceTemplate }>(`/service-templates/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/service-templates/${id}`);
    return response.data;
  },
};

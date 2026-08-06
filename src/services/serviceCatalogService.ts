import api from '../config/api';
import type {
  ServiceCategory,
  ServiceSubCategory,
  ServiceTemplate,
  PricingFormula,
  AgentService,
  PricingConfig,
} from '../types';

export const categoryService = {
  getAll: async (branchId?: string) => {
    const response = await api.get<{ success: boolean; data: ServiceCategory[] }>('/categories', {
      params: branchId ? { branchId } : undefined,
    });
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
  setPopular: async (id: string, isPopular: boolean) => {
    const response = await api.patch<{ success: boolean; data: ServiceCategory }>(`/categories/${id}/popular`, { isPopular });
    return response.data.data;
  },
};

export const subCategoryService = {
  getAll: async (categoryId?: string, branchId?: string) => {
    const response = await api.get<{ success: boolean; data: ServiceSubCategory[] }>('/sub-categories', {
      params: { ...(categoryId ? { categoryId } : {}), ...(branchId ? { branchId } : {}) },
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
  setPopular: async (id: string, isPopular: boolean) => {
    const response = await api.patch<{ success: boolean; data: ServiceSubCategory }>(`/sub-categories/${id}/popular`, { isPopular });
    return response.data.data;
  },
};

export const pricingFormulaService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: PricingFormula[] }>('/pricing-formulas');
    return response.data.data || [];
  },
};

export const serviceTemplateService = {
  getAll: async (subCategoryId?: string, branchId?: string) => {
    const response = await api.get<{ success: boolean; data: ServiceTemplate[] }>('/service-templates', {
      params: { ...(subCategoryId ? { subCategoryId } : {}), ...(branchId ? { branchId } : {}) },
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

// Agent Services — a branch's own rate/configuration for a service template.
export const agentServiceService = {
  getAll: async (params?: { branchId?: string; serviceTemplateId?: string; subCategoryId?: string; isActive?: boolean }) => {
    const response = await api.get<{ success: boolean; data: AgentService[]; count: number }>('/agent-services', { params });
    return response.data.data || [];
  },
  create: async (data: {
    branchId: string;
    serviceTemplateId: string;
    pricePerUnit?: number;
    constant?: number;
    colorPriceModifier?: number;
    isActive?: boolean;
    supportsPrintCut?: boolean;
    supportsColor?: boolean;
    supportsFrontBack?: boolean;
    supportsFrontOnly?: boolean;
  }) => {
    const response = await api.post<{ success: boolean; data: AgentService }>('/agent-services', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<AgentService>) => {
    const response = await api.put<{ success: boolean; data: AgentService }>(`/agent-services/${id}`, data);
    return response.data.data;
  },
  updatePricingConfig: async (id: string, pricingConfig: PricingConfig) => {
    const response = await api.put<{ success: boolean; data: AgentService }>(`/agent-services/${id}/pricing-config`, { pricingConfig });
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/agent-services/${id}`);
    return response.data;
  },
  setPrimary: async (id: string) => {
    const response = await api.patch<{ success: boolean; data: AgentService }>(`/agent-services/${id}/set-primary`, {});
    return response.data.data;
  },
};

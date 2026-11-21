import api from '../config/api';

export interface BranchCommission {
  id: string;
  name: string;
  status: string;
  selfManaged: boolean;
  listed: boolean;
  /** The shop's own rate, or null when it pays the platform rate */
  customRate: number | null;
  reason: string | null;
  expiresAt: string | null;
  effectiveRate: number;
}

export interface CommissionOverview {
  /** The platform-wide rate, in % */
  rate: number;
  branches: BranchCommission[];
}

/**
 * Printdecore's commission: a platform-wide % added on top of every quote,
 * which a shop can override with its own %.
 */
export const commissionService = {
  getOverview: async () => {
    const response = await api.get<{ success: boolean; data: CommissionOverview }>('/commission/admin');
    return response.data.data;
  },
  setRate: async (rate: number) => {
    await api.put('/commission/admin/rate', { rate });
  },
  setBranchRate: async (branchId: string, data: { rate: number; reason?: string; expiresAt?: string }) => {
    await api.put(`/commission/admin/branches/${branchId}`, data);
  },
  clearBranchRate: async (branchId: string) => {
    await api.delete(`/commission/admin/branches/${branchId}`);
  },
  /** The rate a branch pays now (its own, or the platform's) */
  getRate: async (branchId?: string) => {
    const response = await api.get<{ success: boolean; data: { rate: number } }>('/commission/rate', {
      params: branchId ? { branchId } : {},
    });
    return response.data.data.rate;
  },
};

/** The customer's price for a shop price at a rate — matches the server */
export const withCommission = (shopPrice: number, rate: number) => {
  const commission = Math.round(shopPrice * rate) / 100;
  return { commission, customerPrice: Math.round((shopPrice + commission) * 100) / 100 };
};

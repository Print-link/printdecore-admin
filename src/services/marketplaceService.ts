import api from '../config/api';

export type FulfilmentMode = 'managed' | 'self_managed';

export interface ReadinessItem {
  key: 'self_managed' | 'active' | 'location' | 'hours' | 'services' | 'payouts';
  label: string;
  done: boolean;
  owner: 'ops' | 'vendor';
  hint: string;
}

/** How a vendor works with Printdecore and whether customers can order from it. */
export interface MarketplaceStatus {
  fulfilmentMode: FulfilmentMode;
  marketplaceListed: boolean;
  acceptingOrders: boolean;
  checklist: ReadinessItem[];
  ready: boolean;
  live: boolean;
}

export const marketplaceService = {
  getStatus: async (branchId: string) => {
    const response = await api.get<{ success: boolean; data: MarketplaceStatus }>(`/branches/${branchId}/marketplace`);
    return response.data.data;
  },
  update: async (branchId: string, data: { fulfilmentMode?: FulfilmentMode; marketplaceListed?: boolean }) => {
    const response = await api.patch<{ success: boolean; data: MarketplaceStatus }>(`/branches/${branchId}/marketplace`, data);
    return response.data.data;
  },
};

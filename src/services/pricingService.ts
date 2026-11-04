import api from '../config/api';
import type { PricingConfig } from '../types';

/** Which saved setup a preview prices from: Printdecore's customer price, or one branch's own rate. */
export type PricingSource = { serviceTemplateId: string } | { agentServiceId: string };

export interface PreviewRequest {
  quantity: number;
  width?: number;
  height?: number;
  measurementUnit?: string;
  filePages?: number;
  selectedBaseConfigId?: string;
  selectedOptions?: string[];
  selectedCustomSpecs?: string[];
}

export const pricingService = {
  /**
   * Price a sample order with the server's pricing engine — the same one that
   * prices real orders — optionally against an unsaved draft of the setup.
   */
  preview: async (source: PricingSource, request: PreviewRequest, pricingConfig?: PricingConfig) => {
    const response = await api.post<{ success: boolean; data: { calculatedPrice: number; formulaType: string } }>(
      '/pricing/preview',
      { ...source, pricingConfig, request },
    );
    return response.data.data;
  },
};

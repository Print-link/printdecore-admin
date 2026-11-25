import api from '../config/api';

/** A wide card in the customer app's home-page promo row (backend: /api/promo-banners) */
export interface PromoBanner {
  id: string;
  headline: string;
  subline: string | null;
  imageUrl: string | null;
  backgroundColor: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PromoBannerInput = Pick<
  PromoBanner,
  'headline' | 'subline' | 'imageUrl' | 'backgroundColor' | 'linkUrl' | 'isActive' | 'startsAt' | 'endsAt'
>;

export const promoBannerService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: PromoBanner[] }>('/promo-banners/all');
    return response.data.data || [];
  },
  create: async (data: PromoBannerInput) => {
    const response = await api.post<{ success: boolean; data: PromoBanner }>('/promo-banners', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<PromoBannerInput>) => {
    const response = await api.put<{ success: boolean; data: PromoBanner }>(`/promo-banners/${id}`, data);
    return response.data.data;
  },
  reorder: async (ids: string[]) => {
    const response = await api.put<{ success: boolean; data: PromoBanner[] }>('/promo-banners/order', { ids });
    return response.data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/promo-banners/${id}`);
  },
  /** Upload the banner image; returns its URL */
  uploadImage: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'promo-banners');
    const response = await api.post<{ success: boolean; data: { url: string } }>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.url;
  },
};

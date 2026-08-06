import api from '../config/api';

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

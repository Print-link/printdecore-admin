import api from '../config/api';
import type { DashboardStats } from '../types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>('/superadmin/stats');
  return response.data.data;
};

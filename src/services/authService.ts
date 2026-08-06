import api from '../config/api';
import type { SuperAdmin } from '../types';

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

// OTP email verification — required before a manager account can be registered (POST /auth/register
// 403s without a verified OTP row for the email).
export const otpService = {
  sendManagerOTP: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string; data: { email: string; expiresIn: string } }>(
      '/auth/register/send-otp',
      { email }
    );
    return response.data;
  },
  verify: async (email: string, otp: string) => {
    const response = await api.post<{ success: boolean; message: string; data: { email: string; verified: boolean } }>(
      '/otp/verify-otp',
      { email, otp }
    );
    return response.data;
  },
  resend: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string; data: { email: string; expiresIn: string } }>(
      '/otp/resend-otp',
      { email }
    );
    return response.data;
  },
};

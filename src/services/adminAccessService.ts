import api from '../config/api';
import type { SuperAdmin } from '../types';
import type { AdminGrants, AdminPermission } from '../auth/permissions';

export interface AdminPermissionInfo {
  key: AdminPermission;
  name: string;
  description: string;
  category: string;
}

export interface AdminRole {
  id: string;
  systemKey: string | null;
  name: string;
  description: string | null;
  isLocked: boolean;
  permissions: AdminPermission[];
  holderCount: number;
}

export interface AdminRoleAssignment {
  roleId: string;
  roleName?: string;
  /** null = every branch */
  branchId: string | null;
  branchName?: string | null;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: AdminRoleAssignment[];
}

export interface AdminInvitation {
  id: string;
  email: string;
  roles: AdminRoleAssignment[];
  expiresAt: string;
  createdAt: string;
  lastSentAt: string;
  sentCount: number;
  /** Past its expiry: the link no longer works until it's resent */
  expired: boolean;
  invitedByName: string | null;
}

export interface InviteSendResult {
  id: string;
  email: string;
  /** false when the mail service refused it; the invite still exists and can be resent */
  emailSent: boolean;
}

/** What an invited person sees on the accept page */
export interface InvitationPreview {
  email: string;
  invitedByName: string | null;
  roles: string[];
  expiresAt: string;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
}

type Ok<T> = { success: boolean; data: T };

/** Admin dashboard access: your own permissions, roles, admins, and browser notifications */
export const adminAccessService = {
  me: async () => (await api.get<Ok<{ superAdmin: SuperAdmin } & AdminGrants>>('/admin-access/me')).data.data,

  permissions: async () => (await api.get<Ok<AdminPermissionInfo[]>>('/admin-access/permissions')).data.data,
  roles: async () => (await api.get<Ok<AdminRole[]>>('/admin-access/roles')).data.data,
  createRole: async (data: { name: string; description?: string; permissions: AdminPermission[] }) =>
    (await api.post<Ok<{ id: string }>>('/admin-access/roles', data)).data.data,
  updateRole: async (id: string, data: { name?: string; description?: string; permissions?: AdminPermission[] }) =>
    (await api.put(`/admin-access/roles/${id}`, data)).data,
  deleteRole: async (id: string) => (await api.delete(`/admin-access/roles/${id}`)).data,

  admins: async () => (await api.get<Ok<AdminAccount[]>>('/admin-access/admins')).data.data,
  invitations: async () => (await api.get<Ok<AdminInvitation[]>>('/admin-access/invitations')).data.data,
  invite: async (email: string, roles: AdminRoleAssignment[]) =>
    (await api.post<Ok<InviteSendResult>>('/admin-access/invitations', {
      email,
      roles: roles.map(({ roleId, branchId }) => ({ roleId, branchId })),
    })).data.data,
  resendInvitation: async (id: string) => (await api.post<Ok<InviteSendResult>>(`/admin-access/invitations/${id}/resend`)).data.data,
  revokeInvitation: async (id: string) => (await api.delete(`/admin-access/invitations/${id}`)).data,

  /** Public: the invitee checks their link (no sign-in) */
  lookupInvitation: async (token: string) =>
    (await api.post<Ok<InvitationPreview>>('/admin-invitations/lookup', { token })).data.data,
  /** Public: the invitee sets their own name and password */
  acceptInvitation: async (token: string, name: string, password: string) =>
    (await api.post<Ok<{ email: string }>>('/admin-invitations/accept', { token, name, password })).data.data,
  updateAdmin: async (id: string, data: { name?: string; isActive?: boolean }) => (await api.put(`/admin-access/admins/${id}`, data)).data,
  setAdminRoles: async (id: string, roles: AdminRoleAssignment[]) =>
    (await api.put(`/admin-access/admins/${id}/roles`, { roles: roles.map(({ roleId, branchId }) => ({ roleId, branchId })) })).data,

  auditLog: async () => (await api.get<Ok<AdminAuditEntry[]>>('/admin-access/audit-log')).data.data,

  pushKey: async () => (await api.get<Ok<{ publicKey: string | null }>>('/admin-access/push/key')).data.data.publicKey,
  pushSubscribe: async (subscription: PushSubscriptionJSON) => (await api.post('/admin-access/push/subscribe', { subscription })).data,
  /** `token` lets sign-out finish this after the stored token is cleared */
  pushUnsubscribe: async (endpoint: string, token?: string) =>
    (await api.post('/admin-access/push/unsubscribe', { endpoint }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)).data,
};

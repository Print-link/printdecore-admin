/**
 * What an admin can be allowed to do. Mirrors the backend
 * (printdecore-backend/src/features/adminAccess/adminPermissions.ts), which is
 * what actually enforces it; the dashboard only hides what you can't use.
 */
export type AdminPermission =
  | 'dashboard.view'
  | 'orders.view'
  | 'orders.manage'
  | 'orders.assign'
  | 'quotes.manage'
  | 'custom_requests.manage'
  | 'payments.view'
  | 'payments.refund'
  | 'catalog.manage'
  | 'discounts.manage'
  | 'marketplace.manage'
  | 'branches.view'
  | 'branches.manage'
  | 'vendors.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'support.manage'
  | 'messaging.manage'
  | 'content.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'audit.view'
  | 'admins.manage';

/** Any one of these is enough */
export type PermissionNeed = AdminPermission | AdminPermission[];

export interface AdminGrants {
  /** Everything the admin holds anywhere */
  permissions: AdminPermission[];
  /** Held for every branch */
  global: AdminPermission[];
  /** Held only for these branches */
  branches: Record<string, AdminPermission[]>;
}

export const EMPTY_GRANTS: AdminGrants = { permissions: [], global: [], branches: {} };

const asList = (need: PermissionNeed) => (Array.isArray(need) ? need : [need]);

/** Does the admin hold any of these (anywhere, or at `branchId` when given)? */
export const holds = (grants: AdminGrants, need: PermissionNeed, branchId?: string | null): boolean =>
  asList(need).some((p) =>
    branchId === undefined
      ? grants.permissions.includes(p)
      : grants.global.includes(p) || (!!branchId && !!grants.branches[branchId]?.includes(p)),
  );

/** What each page needs. Pages not listed are open to every signed-in admin. */
export const PAGE_PERMISSIONS: Record<string, PermissionNeed> = {
  '/dashboard': 'dashboard.view',
  '/orders': 'orders.view',
  '/quotations': ['quotes.manage', 'custom_requests.manage'],
  '/printer-sales': 'marketplace.manage',
  '/services': 'catalog.manage',
  '/pricing': 'catalog.manage',
  '/discounts': 'discounts.manage',
  '/branches': 'branches.view',
  '/managers': ['vendors.manage', 'branches.view'],
  '/clerks': ['vendors.manage', 'branches.view'],
  '/clients': ['customers.view', 'orders.view'],
  '/whatsapp': 'messaging.manage',
  '/support': 'support.manage',
  '/blog': 'content.manage',
  '/promo-banners': 'content.manage',
  '/waitlist': 'content.manage',
  '/commission': 'finance.view',
  '/billing': 'finance.view',
  '/reports': 'finance.view',
  '/activity-logs': ['audit.view', 'admins.manage'],
  '/roles': 'admins.manage',
};

/** The permission for a path: the longest matching prefix in PAGE_PERMISSIONS */
export const needForPath = (pathname: string): PermissionNeed | undefined => {
  const key = Object.keys(PAGE_PERMISSIONS)
    .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
  return key ? PAGE_PERMISSIONS[key] : undefined;
};

/** Where to send an admin after sign-in: the first page they can open */
export const firstAllowedPath = (grants: AdminGrants): string => {
  const order = ['/dashboard', '/orders', '/quotations', '/support', '/services', '/branches', '/clients', '/commission', '/blog', '/roles'];
  return order.find((p) => holds(grants, PAGE_PERMISSIONS[p])) ?? '/no-access';
};

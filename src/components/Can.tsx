import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { PermissionNeed } from '../auth/permissions';

interface CanProps {
  /** Any one of these is enough */
  permission: PermissionNeed;
  /** Check at this branch (a grant for every branch also counts) */
  branchId?: string | null;
  children: ReactNode;
  /** Shown instead when not allowed (nothing by default) */
  fallback?: ReactNode;
}

/** Renders its children only for admins holding the permission. The server enforces it too. */
export const Can = ({ permission, branchId, children, fallback = null }: CanProps) => {
  const { can } = useAuth();
  return <>{can(permission, branchId) ? children : fallback}</>;
};

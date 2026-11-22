import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { superAdminAuth } from '../services/superAdminService';
import { adminAccessService } from '../services/adminAccessService';
import type { SuperAdmin } from '../types';
import { EMPTY_GRANTS, holds, type AdminGrants, type PermissionNeed } from '../auth/permissions';
import toast from 'react-hot-toast';

interface AuthContextType {
  superAdmin: SuperAdmin | null;
  token: string | null;
  grants: AdminGrants;
  /** Does the signed-in admin hold any of these (at `branchId`, when given)? */
  can: (need: PermissionNeed, branchId?: string | null) => boolean;
  /** Re-read permissions from the server (after an admin changes roles) */
  refreshPermissions: () => Promise<void>;
  login: (email: string, password: string) => Promise<AdminGrants>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GRANTS_KEY = 'superAdminGrants';
/** Roles can change while you're signed in; pick that up without a reload */
const REFRESH_MS = 60_000;

const readGrants = (): AdminGrants => {
  try {
    const raw = localStorage.getItem(GRANTS_KEY);
    return raw ? { ...EMPTY_GRANTS, ...JSON.parse(raw) } : EMPTY_GRANTS;
  } catch {
    return EMPTY_GRANTS;
  }
};

const pickGrants = (data: Partial<AdminGrants>): AdminGrants => ({
  permissions: data.permissions ?? [],
  global: data.global ?? [],
  branches: data.branches ?? {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [grants, setGrants] = useState<AdminGrants>(EMPTY_GRANTS);
  const [isLoading, setIsLoading] = useState(true);

  const storeGrants = (g: AdminGrants) => {
    setGrants(g);
    try {
      localStorage.setItem(GRANTS_KEY, JSON.stringify(g));
    } catch {
      // storage full or blocked: the in-memory copy still works
    }
  };

  const refreshPermissions = useCallback(async () => {
    if (!localStorage.getItem('superAdminToken')) return;
    try {
      const me = await adminAccessService.me();
      setSuperAdmin(me.superAdmin);
      localStorage.setItem('superAdmin', JSON.stringify(me.superAdmin));
      storeGrants(pickGrants(me));
    } catch {
      // 401 is handled by the api interceptor; anything else keeps the last known grants
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('superAdminToken');
    const storedSuperAdmin = localStorage.getItem('superAdmin');
    if (storedToken && storedSuperAdmin) {
      setToken(storedToken);
      setSuperAdmin(JSON.parse(storedSuperAdmin));
      setGrants(readGrants());
      // Show the page with cached grants, then confirm them with the server
      refreshPermissions().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshPermissions]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(refreshPermissions, REFRESH_MS);
    const onFocus = () => refreshPermissions();
    window.addEventListener('focus', onFocus);
    // The api layer asks for a refresh when the server says "permission denied"
    window.addEventListener('admin-permissions-stale', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('admin-permissions-stale', onFocus);
    };
  }, [token, refreshPermissions]);

  const login = async (email: string, password: string) => {
    try {
      const response = await superAdminAuth.login(email, password);
      if (!response.success || !response.data) throw new Error('Login failed');
      const g = pickGrants(response.data);
      setToken(response.data.token);
      setSuperAdmin(response.data.superAdmin);
      localStorage.setItem('superAdminToken', response.data.token);
      localStorage.setItem('superAdmin', JSON.stringify(response.data.superAdmin));
      storeGrants(g);
      toast.success('Login successful');
      return g;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    // Stop this browser receiving this admin's alerts (best effort, before the token goes)
    const tokenAtLogout = localStorage.getItem('superAdminToken');
    if ('serviceWorker' in navigator && tokenAtLogout) {
      navigator.serviceWorker
        .getRegistration('/admin-sw.js')
        .then((reg) => reg?.pushManager.getSubscription())
        .then(async (sub) => {
          if (!sub) return;
          await adminAccessService.pushUnsubscribe(sub.endpoint, tokenAtLogout).catch(() => {});
          await sub.unsubscribe();
        })
        .catch(() => {});
    }
    setToken(null);
    setSuperAdmin(null);
    setGrants(EMPTY_GRANTS);
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdmin');
    localStorage.removeItem(GRANTS_KEY);
    toast.success('Logged out successfully');
  };

  const can = useCallback((need: PermissionNeed, branchId?: string | null) => holds(grants, need, branchId), [grants]);

  return (
    <AuthContext.Provider
      value={{
        superAdmin,
        token,
        grants,
        can,
        refreshPermissions,
        login,
        logout,
        isLoading,
        isAuthenticated: !!token && !!superAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

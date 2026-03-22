import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { superAdminAuth } from '../services/superAdminService';
import type { SuperAdmin } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  superAdmin: SuperAdmin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('superAdminToken');
    const storedSuperAdmin = localStorage.getItem('superAdmin');
    
    if (storedToken && storedSuperAdmin) {
      setToken(storedToken);
      setSuperAdmin(JSON.parse(storedSuperAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await superAdminAuth.login(email, password);
      if (response.success && response.data) {
        setToken(response.data.token);
        setSuperAdmin(response.data.superAdmin);
        localStorage.setItem('superAdminToken', response.data.token);
        localStorage.setItem('superAdmin', JSON.stringify(response.data.superAdmin));
        toast.success('Login successful');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setSuperAdmin(null);
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdmin');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        superAdmin,
        token,
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


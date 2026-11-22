import { Navigate, useLocation } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Layout } from "../components/Layout";
import { firstAllowedPath, needForPath } from "../auth/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** A page for admins who can't open what they asked for */
export const NoAccess = () => {
  const { grants } = useAuth();
  const home = firstAllowedPath(grants);
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center py-24 px-4">
        <ShieldOff className="w-10 h-10 text-gray-400 mb-4" />
        <h1 className="text-lg font-semibold text-gray-900">You don't have access to this page</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Ask an admin who manages roles to give you the permission you need.
        </p>
        {home !== "/no-access" && (
          <a href={home} className="mt-6 text-sm font-medium text-gray-900 underline">
            Go to a page you can open
          </a>
        )}
      </div>
    </Layout>
  );
};

/** Signed in, and allowed to open this page (PAGE_PERMISSIONS in auth/permissions.ts) */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, can } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const need = needForPath(pathname);
  if (need && !can(need)) return <NoAccess />;

  return <>{children}</>;
};

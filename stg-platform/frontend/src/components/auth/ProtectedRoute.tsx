import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasAdminAccess, hasDashboardAccess, hasModeratorAccess } from "../../utils/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireDashboardAccess?: boolean;
  requireAdmin?: boolean;
  requiredRole?: "admin" | "moderator";
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireDashboardAccess = false,
  requireAdmin = false,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, profile, isAuthenticated, loading } = useAuth();
  const requireAuthEnv = import.meta.env.VITE_REQUIRE_AUTH === "true";
  const authIsRequired = requireAuth || requireAuthEnv;

  if (loading) {
    return (
      <div className="stg-auth-screen tactical-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="size-12 rounded-full border-4 border-[#a855f7] border-t-[#c084fc]" />
          </div>
          <p className="mt-4 text-[#c4b5fd]">Carregando acesso STG...</p>
        </div>
      </div>
    );
  }

  if ((requireDashboardAccess || requireAdmin) && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authIsRequired && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !hasAdminAccess(user ?? profile)) {
    return <Navigate to="/" replace />;
  }

  if ((requireDashboardAccess || requiredRole) && !hasDashboardAccess(user ?? profile)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "admin" && !hasAdminAccess(user ?? profile)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "moderator" && !hasModeratorAccess(user ?? profile)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

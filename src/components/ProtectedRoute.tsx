import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading, isProfessional, isDoctor, isAdvisor } = useUserRole();
  const location = useLocation();

  // Show loading state while checking auth
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // Check if user is authenticated
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Special handling: If a professional tries to access user dashboard, redirect to their workbench
  if (location.pathname === "/dashboard" && isProfessional) {
    if (isDoctor) {
      return <Navigate to="/doctor-workbench" replace />;
    } else if (isAdvisor) {
      return <Navigate to="/advisor-workbench" replace />;
    }
  }

  // Special handling: If a regular user tries to access professional routes, redirect to dashboard
  const professionalRoutes = ["/doctor-workbench", "/advisor-workbench", "/doctor-profile-setup"];
  if (professionalRoutes.includes(location.pathname) && !isProfessional) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      // Redirect professionals to their workbench, users to dashboard
      if (isProfessional) {
        if (isDoctor) {
          return <Navigate to="/doctor-workbench" replace />;
        } else if (isAdvisor) {
          return <Navigate to="/advisor-workbench" replace />;
        }
      }
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

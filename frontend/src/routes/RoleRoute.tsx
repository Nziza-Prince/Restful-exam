import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface RoleRouteProps {
  roles: UserRole[];
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

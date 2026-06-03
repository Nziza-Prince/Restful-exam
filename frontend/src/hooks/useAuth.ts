import { useAppSelector } from '@/store/hooks';

export function useAuth() {
  const { user, isAuthenticated, loading, initializing, error } = useAppSelector(
    (state) => state.auth,
  );

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'user';
  const isInspector = user?.role === 'inspector';

  return { user, isAuthenticated, loading, initializing, error, isAdmin, isCustomer, isInspector };
}

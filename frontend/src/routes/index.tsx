import { Navigate, createBrowserRouter } from 'react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SetPasswordPage } from '@/pages/SetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { ExtinguishersPage } from '@/pages/ExtinguishersPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { RenewalsPage } from '@/pages/RenewalsPage';
import { CompliancePage } from '@/pages/CompliancePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/set-password', element: <SetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'extinguishers', element: <ExtinguishersPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          {
            element: <RoleRoute roles={['admin']} />,
            children: [
              { path: 'customers', element: <CustomersPage /> },
              { path: 'compliance', element: <CompliancePage /> },
              { path: 'reports', element: <ReportsPage /> },
              { path: 'renewals', element: <RenewalsPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

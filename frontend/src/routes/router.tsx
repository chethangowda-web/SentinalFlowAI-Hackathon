import * as React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

const LoginPage = React.lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('@/features/auth/pages/ResetPasswordPage'));

const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'));
const IncidentsPage = React.lazy(() => import('@/pages/incidents/IncidentsPage'));
const IntelligencePage = React.lazy(() => import('@/pages/intelligence/IntelligenceDashboard'));
const RunbooksPage = React.lazy(() => import('@/features/runbooks/pages/RunbooksPage'));
const NotificationsPage = React.lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const MonitoringPage = React.lazy(() => import('@/features/monitoring/pages/MonitoringPage'));
const AgentsPage = React.lazy(() => import('@/features/agents/pages/AgentsPage'));
const KnowledgePage = React.lazy(() => import('@/features/knowledge/pages/KnowledgePage'));
const ReportsPage = React.lazy(() => import('@/features/reports/pages/ReportsPage'));
const OrganizationsPage = React.lazy(() => import('@/features/organizations/pages/OrganizationsPage'));
const UsersPage = React.lazy(() => import('@/features/users/pages/UsersPage'));
const AuditPage = React.lazy(() => import('@/features/audit/pages/AuditPage'));
const PlatformPage = React.lazy(() => import('@/features/platform/pages/PlatformPage'));
const SettingsPage = React.lazy(() => import('@/features/settings/pages/SettingsPage'));

const ForbiddenPage = React.lazy(() => import('@/components/feedback/ForbiddenPage'));
const NotFoundPage = React.lazy(() => import('@/components/feedback/NotFoundPage'));
const ErrorPage = React.lazy(() => import('@/components/feedback/ErrorPage'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestRoute>
        <ForgotPasswordPage />
      </GuestRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <GuestRoute>
        <ResetPasswordPage />
      </GuestRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'intelligence', element: <IntelligencePage /> },
      { path: 'runbooks', element: <RunbooksPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'monitoring', element: <MonitoringPage /> },
      { path: 'agents', element: <AgentsPage /> },
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'organizations', element: <OrganizationsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'platform', element: <PlatformPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '403', element: <ForbiddenPage /> },
      { path: '500', element: <ErrorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;

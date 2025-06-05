// modules/analytics/routes/index.js - ACTUALIZADO
import { lazy } from 'react';

// Lazy loading de las páginas
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Reports = lazy(() => import('../pages/Reports.jsx'));

export const analyticsRoutes = [
  {
    path: '/analytics',
    element: <Dashboard />,
  },
  {
    path: '/analytics/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/analytics/reports',
    element: <Reports />,
  },
];

export default analyticsRoutes;
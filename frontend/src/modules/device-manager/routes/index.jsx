// modules/analytics/routes/index.js - ACTUALIZADO
import { lazy } from 'react';

// Lazy loading de las páginas
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Reports = lazy(() => import('../pages/Reports.jsx'));

export const deviceManagerRoutes = [
  {
    path: '/device-manager',
    element: <Dashboard />,
  },
  {
    path: '/device-manager/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/device-manager/reports',
    element: <Reports />,
  },
];

export default deviceManagerRoutes;
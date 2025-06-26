// modules/analytics/routes/routeConfig.js
import { lazy } from 'react';

// Lazy loading of components
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Reports = lazy(() => import('../pages/Reports.jsx'));

// Module configuration
export const MODULE_CONFIG = {
  basePath: '/analytics',
  name: 'analytics',
  displayName: 'Analytics',
  icon: '📊'
};

// ✨ Easy route configuration - USER ONLY MODIFIES THIS
export const ROUTE_DEFINITIONS = [
  {
    path: '/',
    component: Dashboard,
    name: 'Dashboard',
    showInMenu: true,
    menuOrder: 1,
    isDefault: true,
    requiresAuth: true,
    permissions: ['analytics.read']
  },
  {
    path: '/dashboard',
    component: Dashboard,
    name: 'Dashboard',
    showInMenu: false, // Alias - don't show in menu
    requiresAuth: true
  },
  {
    path: '/reports',
    component: Reports,
    name: 'Reports',
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ['analytics.reports']
  }
];
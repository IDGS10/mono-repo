// modules/organizations/routes/routeConfig.js
import { lazy } from 'react';

// Lazy loading de componentes
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const OrganizationList = lazy(() => import('../pages/OrganizationList.jsx'));
const OrganizationDetail = lazy(() => import('../pages/OrganizationDetail.jsx'));
const Members = lazy(() => import('../pages/Members.jsx'));

// Configuración del módulo
export const MODULE_CONFIG = {
  basePath: '/organizations',
  name: 'organizations',
  displayName: 'Organizations',
  icon: '🏢'
};

// ✨ Configuración fácil de rutas
export const ROUTE_DEFINITIONS = [
  {
    path: '/',
    component: Dashboard,
    name: 'Dashboard',
    showInMenu: true,
    menuOrder: 1,
    isDefault: true,
    requiresAuth: true,
    permissions: ['organizations.read']
  },
  {
    path: '/list',
    component: OrganizationList,
    name: 'Organizations',
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ['organizations.read']
  },
  {
    path: '/members',
    component: Members,
    name: 'Members',
    showInMenu: true,
    menuOrder: 3,
    requiresAuth: true,
    permissions: ['organizations.members']
  },
  {
    path: '/organization/:id',
    component: OrganizationDetail,
    name: 'Organization Detail',
    showInMenu: false, // Ruta dinámica
    requiresAuth: true,
    permissions: ['organizations.read']
  }
];
// modules/swarm-manager/routes/routeConfig.js
import { lazy } from 'react';

// Lazy loading de componentes
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Nodes = lazy(() => import('../pages/Nodes.jsx'));
const Services = lazy(() => import('../pages/Services.jsx'));
const Networks = lazy(() => import('../pages/Networks.jsx'));
const Monitoring = lazy(() => import('../pages/Monitoring.jsx'));

// Configuración del módulo
export const MODULE_CONFIG = {
  basePath: '/swarm',
  name: 'swarm-manager',
  displayName: 'Swarm Manager',
  icon: '🐝'
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
    permissions: ['swarm.read']
  },
  {
    path: '/nodes',
    component: Nodes,
    name: 'Nodes',
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ['swarm.nodes']
  },
  {
    path: '/services',
    component: Services,
    name: 'Services',
    showInMenu: true,
    menuOrder: 3,
    requiresAuth: true,
    permissions: ['swarm.services']
  },
  {
    path: '/networks',
    component: Networks,
    name: 'Networks',
    showInMenu: true,
    menuOrder: 4,
    requiresAuth: true,
    permissions: ['swarm.networks']
  },
  {
    path: '/monitoring',
    component: Monitoring,
    name: 'Monitoring',
    showInMenu: true,
    menuOrder: 5,
    requiresAuth: true,
    permissions: ['swarm.monitoring']
  }
];
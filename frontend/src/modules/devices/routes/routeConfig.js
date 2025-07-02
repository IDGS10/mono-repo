// modules/device-manager/routes/routeConfig.js
import { lazy } from 'react';

// Lazy loading de componentes
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const DeviceList = lazy(() => import('../pages/DeviceList.jsx'));
const DeviceDetail = lazy(() => import('../pages/DeviceDetail.jsx'));

// Configuración del módulo
export const MODULE_CONFIG = {
  basePath: '/devices',
  name: 'devices',
  displayName: 'Device Manager',
  icon: '📱'
};

// ✨ Aquí el usuario solo agrega/modifica rutas fácilmente
export const ROUTE_DEFINITIONS = [
  {
    path: '/',
    component: Dashboard,
    name: 'Dashboard',
    showInMenu: true,
    menuOrder: 1,
    isDefault: true,
    requiresAuth: true,
    permissions: ['devices.read']
  },
  {
    path: '/list',
    component: DeviceList,
    name: 'Device List',
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ['devices.read']
  },
  {
    path: '/device/:id',
    component: DeviceDetail,
    name: 'Device Detail',
    showInMenu: false, // No mostrar en menú (ruta dinámica)
    requiresAuth: true,
    permissions: ['devices.read']
  }
];
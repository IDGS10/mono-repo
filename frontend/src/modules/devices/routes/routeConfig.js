import { lazy } from 'react';

const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const DeviceDetail = lazy(() => import('../pages/DeviceDetail.jsx'));

export const MODULE_CONFIG = {
  basePath: '/devices',
  name: 'devices',
  displayName: 'Device Manager',
  icon: '📱'
};

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
    path: '/device/:id',
    component: DeviceDetail,
    name: 'Device Detail',
    showInMenu: false, 
    requiresAuth: true,
    permissions: ['devices.read']
  }
];
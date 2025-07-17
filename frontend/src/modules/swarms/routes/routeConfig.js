// modules/swarm-manager/routes/routeConfig.js
import { lazy } from 'react';

// Lazy loading de componentes
const SelectSwarmRequests = lazy(() => import('../pages/SelectSwarmRequests.jsx'));
const MySwarmCatalog = lazy(() => import('../pages/MySwarmCatalog.jsx'));
const SwarmDetail = lazy(() => import('../pages/SwarmDetail.jsx'));
const EditSwarm = lazy(() => import('../pages/EditSwarm.jsx'));

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
    path: '/SelectSwarmRequests',
    component: SelectSwarmRequests,
    name: 'Solicitudes de enjambre',
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ['swarm.selectSwarmRequests']
  },
  {
    path: '/',
    component: MySwarmCatalog,
    name: 'Catalogo de mis enjambres',
    showInMenu: true,
    menuOrder: 1,
    isDefault: true,
    requiresAuth: true,
    permissions: ['swarm.mySwarmCatalog']
  },
  {
    path: '/SwarmDetail/:id',
    component: SwarmDetail,
    name: 'Detalle de enjambre',
    showInMenu: false,
    menuOrder: 3,
    requiresAuth: true,
    permissions: ['swarm.swarmDetail']
  },
  {
    path: '/EditSwarm',
    component: EditSwarm,
    name: 'Editar enjambre',
    showInMenu: false,
    menuOrder: 4,
    requiresAuth: true,
    permissions: ['swarm.editSwarm']
  }
];
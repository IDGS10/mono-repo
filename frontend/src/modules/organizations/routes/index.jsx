import { MODULE_CONFIG, ROUTE_DEFINITIONS, GLOBAL_ROUTE_DEFINITIONS } from './routeConfig.js';

// Helper to build complete routes
const createRoute = (relativePath, config) => ({
  ...config,
  path: MODULE_CONFIG.basePath + (relativePath === '/' ? '' : relativePath)
});

const moduleRouteDefinitions = ROUTE_DEFINITIONS.map(route => 
  createRoute(route.path, route)
);

const globalRouteDefinitions = GLOBAL_ROUTE_DEFINITIONS.map(route => ({
  ...route,
 
}));

// change all routes
const allRouteDefinitions = [...moduleRouteDefinitions, ...globalRouteDefinitions];

// React Router
export const organizationRoutes = allRouteDefinitions.map(route => ({
  path: route.path,
  element: <route.component />,
  requiresAuth: route.requiresAuth !== false,
  permissions: route.permissions,
  name: route.name,
  isGlobal: route.isGlobal || false
}));

// To menu
export const menuConfig = {
  subItems: moduleRouteDefinitions
    .filter(route => route.showInMenu)
    .sort((a, b) => (a.menuOrder || 99) - (b.menuOrder || 99))
    .map(route => ({
      path: route.path,
      name: route.name,
      isDefault: route.isDefault || false
    }))
};

export const moduleRoutes = moduleRouteDefinitions.map(route => ({
  path: route.path,
  element: <route.component />,
  requiresAuth: route.requiresAuth !== false,
  permissions: route.permissions,
  name: route.name
}));

export const globalRoutes = globalRouteDefinitions.map(route => ({
  path: route.path,
  element: <route.component />,
  requiresAuth: route.requiresAuth !== false,
  permissions: route.permissions,
  name: route.name
}));

// Module info
export const moduleInfo = MODULE_CONFIG;

export default organizationRoutes;

export { globalRoutes as invitationRoutes };
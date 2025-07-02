// modules/analytics/routes/index.js
import { MODULE_CONFIG, ROUTE_DEFINITIONS } from './routeConfig.js';

// Helper to build complete routes
const createRoute = (relativePath, config) => ({
  ...config,
  path: MODULE_CONFIG.basePath + (relativePath === '/' ? '' : relativePath)
});

// Process route definitions
const routeDefinitions = ROUTE_DEFINITIONS.map(route => 
  createRoute(route.path, route)
);

// For React Router
export const analyticsRoutes = routeDefinitions.map(route => ({
  path: route.path,
  element: <route.component />,
  requiresAuth: route.requiresAuth !== false,
  permissions: route.permissions,
  name: route.name
}));

// For the menu
export const menuConfig = {
  subItems: routeDefinitions
    .filter(route => route.showInMenu)
    .sort((a, b) => (a.menuOrder || 99) - (b.menuOrder || 99))
    .map(route => ({
      path: route.path,
      name: route.name,
      isDefault: route.isDefault || false
    }))
};

// Module info
export const moduleInfo = MODULE_CONFIG;

export default analyticsRoutes;
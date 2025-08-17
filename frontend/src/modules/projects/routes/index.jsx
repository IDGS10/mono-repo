// modules/projects/routes/index.js
import React from 'react';
import { MODULE_CONFIG, ROUTE_DEFINITIONS } from './routeConfig.js';
import { ProjectDashboard, CreateProject, ProjectDetail, AddSwarm } from '../pages';

// Helper to build complete routes
const createRoute = (relativePath, config) => ({
  ...config,
  path: MODULE_CONFIG.basePath + (relativePath === '/' ? '' : relativePath)
});

// Process route definitions
const routeDefinitions = ROUTE_DEFINITIONS.map(route => 
  createRoute(route.path, route)
);
// Map component strings to actual component references
const componentMap = {
  'ProjectDashboard': ProjectDashboard,
  'CreateProject': CreateProject,
  'ProjectDetail': ProjectDetail,
  'AddSwarm': AddSwarm
};

// For React Router
export const projectsRoutes = routeDefinitions.map(route => ({
  path: route.path,
  element: React.createElement(componentMap[route.component]),
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

export default projectsRoutes;

export const MODULE_CONFIG = {
  basePath: '/projects',
  name: 'projects',
  displayName: 'Projects',
  icon: '🏗️'
};

export const ROUTE_DEFINITIONS = [
  {
    path: '/',
    component: 'ProjectDashboard',

    name: 'Dashboard',
    showInMenu: true,
    menuOrder: 1,
    isDefault: true,
    requiresAuth: true
  },
  {
    path: '/create',
    component: 'CreateProject',
    name: 'Create Project',
    showInMenu: false,
    requiresAuth: true
  },
  {
    path: '/:id',
    component: 'ProjectDetail',
    name: 'Project Detail',
    showInMenu: false,
    requiresAuth: true
  },
  {
    path: '/:id/add-swarm',
    component: 'AddSwarm',
    name: 'Add Swarm',
    showInMenu: false,
    requiresAuth: true
  }
];
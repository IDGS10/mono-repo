// modules/proyects/routes/routeConfig.js
import { lazy } from 'react';

// Lazy loading de componentes
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const ProjectList = lazy(() => import('../pages/ProjectList.jsx'));
const ProjectDetail = lazy(() => import('../pages/ProjectDetail.jsx'));
const CreateProject = lazy(() => import('../pages/CreateProject.jsx'));

// Configuración del módulo
export const MODULE_CONFIG = {
  basePath: '/projects',
  name: 'proyects',
  displayName: 'Projects',
  icon: '📋'
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
    permissions: ['projects.read']
  },
  {
    path: '/list',
    component: ProjectList,
    name: 'All Projects',
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ['projects.read']
  },
  {
    path: '/create',
    component: CreateProject,
    name: 'Create Project',
    showInMenu: true,
    menuOrder: 3,
    requiresAuth: true,
    permissions: ['projects.create']
  },
  {
    path: '/project/:id',
    component: ProjectDetail,
    name: 'Project Detail',
    showInMenu: false, // Ruta dinámica
    requiresAuth: true,
    permissions: ['projects.read']
  },
  {
    path: '/project/:id/edit',
    component: CreateProject, // Reutilizar componente
    name: 'Edit Project',
    showInMenu: false,
    requiresAuth: true,
    permissions: ['projects.edit']
  }
];
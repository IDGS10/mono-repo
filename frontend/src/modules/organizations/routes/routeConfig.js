import { lazy } from 'react';

const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const CreateOrganization = lazy(() => import('../pages/CreateOrganization.jsx'));
const EditOrganization = lazy(() => import('../pages/EditOrganization.jsx'));
const OrganizationList = lazy(() => import('../pages/OrganizationList.jsx'));
const OrganizationDetail = lazy(() => import('../pages/OrganizationDetail.jsx'));
const Members = lazy(() => import('../pages/Members.jsx'));
const PendingOrganization = lazy(() => import('../pages/PendingOrganization.jsx'));


export const MODULE_CONFIG = {
  basePath: '/organizations',
  name: 'organizations',
  displayName: 'Organizations',
  icon: '🏢'
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
    permissions: ['organizations.read']
  },
  {
    path: '/create',
    component: CreateOrganization,
    name: 'Create Organization',
    showInMenu: false, 
    requiresAuth: true,
    permissions: ['organizations.create', 'organizations.owner']
  },
  {
    path: '/:id/edit',
    component: EditOrganization,
    name: 'Edit Organization',
    showInMenu: false, 
    requiresAuth: true,
    permissions: ['organizations.update', 'organizations.owner']
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
    path: '/PendingOrganization',
    component: PendingOrganization,
    name: 'Pending Organization',
    showInMenu: true,
    menuOrder: 4,
    requiresAuth: true,
    permissions: ['organizations.reports'] 
  },
  {
    path: '/organization/:id',
    component: OrganizationDetail,
    name: 'Organization Detail',
    showInMenu: false, 
    requiresAuth: true,
    permissions: ['organizations.read']
  }
];





 

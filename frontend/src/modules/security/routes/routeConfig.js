// modules/security/routes/routeConfig.js
import { lazy } from 'react';

// Lazy loading de componentes
const Login = lazy(() => import('../pages/Login.jsx'));
const Register = lazy(() => import('../pages/Register.jsx'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../pages/ResetPassword.jsx'));

// Configuración del módulo
export const MODULE_CONFIG = {
  basePath: '/auth',
  name: 'security',
  displayName: 'Security',
  icon: '🔒'
};

// ✨ Configuración fácil de rutas (módulo de sistema)
export const ROUTE_DEFINITIONS = [
  {
    path: '/login',
    component: Login,
    name: 'Login',
    showInMenu: false, // Las rutas de sistema no van en el menú
    requiresAuth: false, // Ruta pública
    isPublic: true
  },
  {
    path: '/register',
    component: Register,
    name: 'Register',
    showInMenu: false,
    requiresAuth: false,
    isPublic: true
  },
  {
    path: '/forgot-password',
    component: ForgotPassword,
    name: 'Forgot Password',
    showInMenu: false,
    requiresAuth: false,
    isPublic: true
  },
  {
    path: '/reset-password',
    component: ResetPassword,
    name: 'Reset Password',
    showInMenu: false,
    requiresAuth: false,
    isPublic: true
  }
];
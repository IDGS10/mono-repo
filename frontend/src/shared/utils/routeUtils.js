// shared/utils/routeUtils.js
// Configuración de los módulos disponibles
export const moduleConfigs = [
  {
    name: 'analytics',
    displayName: 'Analytics',
    icon: '📊',
    path: '/analytics',
    importRoutes: () => import('../../modules/analytics/routes'),
    importMenuConfig: () => import('../../modules/analytics/routes/menuConfig.js')
  },
  {
    name: 'device-manager',
    displayName: 'Device Manager',
    icon: '📱',
    path: '/device-manager',
    importRoutes: () => import('../../modules/device-manager/routes'),
    importMenuConfig: () => import('../../modules/device-manager/routes/menuConfig.js')
  },
  {
    name: 'proyects',
    displayName: 'Projects',
    icon: '📋',
    path: '/projects',
    importRoutes: () => import('../../modules/proyects/routes'),
    importMenuConfig: () => import('../../modules/proyects/routes/menuConfig.js')
  },
  {
    name: 'organizations',
    displayName: 'Organizations',
    icon: '🏢',
    path: '/organizations',
    importRoutes: () => import('../../modules/organizations/routes'),
    importMenuConfig: () => import('../../modules/organizations/routes/menuConfig.js')
  },
  {
    name: 'security',
    displayName: 'Security',
    icon: '🔒',
    path: '/security',
    importRoutes: () => import('../../modules/security/routes'),
    importMenuConfig: () => import('../../modules/security/routes/menuConfig.js')
  },
  {
    name: 'swarm-manager',
    displayName: 'Swarm Manager',
    icon: '🐝',
    path: '/swarm',
    importRoutes: () => import('../../modules/swarm-manager/routes'),
    importMenuConfig: () => import('../../modules/swarm-manager/routes/menuConfig.js')
  }
];

// Función para cargar todas las rutas dinámicamente
export const loadAllRoutes = async () => {
  const allRoutes = [];
  
  for (const moduleConfig of moduleConfigs) {
    try {
      const routeModule = await moduleConfig.importRoutes();
      const routes = routeModule.default || routeModule[`${moduleConfig.name}Routes`];
      
      if (routes) {
        allRoutes.push(...routes);
      }
    } catch (error) {
      console.warn(`No se pudieron cargar las rutas del módulo ${moduleConfig.name}:`, error);
    }
  }
  
  return allRoutes;
};

// Función para cargar la configuración del menú dinámicamente
export const loadMenuItems = async () => {
  const menuItems = [];
  
  for (const moduleConfig of moduleConfigs) {
    try {
      // Intentar cargar configuración personalizada del menú
      const menuConfigModule = await moduleConfig.importMenuConfig();
      const menuConfig = menuConfigModule.default || menuConfigModule.menuConfig;
      
      if (menuConfig) {
        menuItems.push({
          ...moduleConfig,
          ...menuConfig
        });
      } else {
        // Usar configuración por defecto
        menuItems.push({
          path: moduleConfig.path,
          name: moduleConfig.displayName,
          icon: moduleConfig.icon,
          subItems: []
        });
      }
    } catch (error) {
      // Si no existe menuConfig, usar configuración por defecto
      menuItems.push({
        path: moduleConfig.path,
        name: moduleConfig.displayName,
        icon: moduleConfig.icon,
        subItems: []
      });
    }
  }
  
  return menuItems;
};
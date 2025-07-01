<<<<<<< HEAD
export const appModuleConfigs = [
=======
// shared/utils/routeUtils.js
// Configuración de los módulos disponibles
export const moduleConfigs = [
>>>>>>> prod
  {
    name: 'analytics',
    displayName: 'Analytics',
    icon: '📊',
    path: '/analytics',
<<<<<<< HEAD
    importModule: () => import('../../modules/analytics/routes'),
  },
  {
    name: 'devices',
    displayName: 'Device Manager',
    icon: '📱',
    path: '/devices',
    importModule: () => import('../../modules/devices/routes'),
=======
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
>>>>>>> prod
  },
  {
    name: 'proyects',
    displayName: 'Projects',
    icon: '📋',
    path: '/projects',
<<<<<<< HEAD
    importModule: () => import('../../modules/projects/routes'),
=======
    importRoutes: () => import('../../modules/proyects/routes'),
    importMenuConfig: () => import('../../modules/proyects/routes/menuConfig.js')
>>>>>>> prod
  },
  {
    name: 'organizations',
    displayName: 'Organizations',
    icon: '🏢',
    path: '/organizations',
<<<<<<< HEAD
    importModule: () => import('../../modules/organizations/routes'),
  },
  {
    name: 'swarms',
    displayName: 'Swarm Manager',
    icon: '🐝',
    path: '/swarm',
    importModule: () => import('../../modules/swarms/routes'),
  },
]

export const systemModuleConfigs = [
  {
    name: 'security',
    displayName: 'Security',
    icon: '🔒',
    path: '/auth',
    importModule: () => import('../../modules/security/routes'),
    systemModule: true,
    description: 'Authentication and security management',
  },
]

// Helper to get module routes in a generic way
const getModuleRoutes = (routeModule, moduleName) => {
  // Priority order to search for routes:
  // 1. Default export
  // 2. Named export with module name + "Routes" (e.g: analyticsRoutes)
  // 3. Generic "routes" export
  
  if (routeModule.default) {
    return routeModule.default;
  }
  
  // Build name dynamically: analytics -> analyticsRoutes
  const moduleRoutesName = `${moduleName}Routes`;
  if (routeModule[moduleRoutesName]) {
    return routeModule[moduleRoutesName];
  }
  
  // Generic fallback
  if (routeModule.routes) {
    return routeModule.routes;
  }
  
  return null;
};

// Function to load application module routes
export const loadAppRoutes = async () => {
  const routes = []

  for (const moduleConfig of appModuleConfigs) {
    try {
      const routeModule = await moduleConfig.importModule()
      const moduleRoutes = getModuleRoutes(routeModule, moduleConfig.name);

      if (moduleRoutes) {
        const routesWithMetadata = moduleRoutes.map((route) => ({
          ...route,
          moduleType: 'app',
          moduleName: moduleConfig.name,
          moduleDisplayName: moduleConfig.displayName,
        }))
        routes.push(...routesWithMetadata)
      } else {
        console.warn(`No routes found in module ${moduleConfig.name}. 
        Make sure to export:
        - export default [routes]
        - export const ${moduleConfig.name}Routes = [routes]
        - export const routes = [routes]`);
      }
    } catch (error) {
      console.warn(
        `Could not load routes from module ${moduleConfig.name}:`,
        error
      )
    }
  }

  return routes
}

// Function to load system module routes
export const loadSystemRoutes = async () => {
  const routes = []

  for (const moduleConfig of systemModuleConfigs) {
    try {
      const routeModule = await moduleConfig.importModule()
      const moduleRoutes = getModuleRoutes(routeModule, moduleConfig.name);

      if (moduleRoutes) {
        const routesWithMetadata = moduleRoutes.map((route) => ({
          ...route,
          moduleType: 'system',
          moduleName: moduleConfig.name,
          moduleDisplayName: moduleConfig.displayName,
          requiresAuth: route.requiresAuth !== false,
        }))
        routes.push(...routesWithMetadata)
      } else {
        console.warn(`No routes found in system module ${moduleConfig.name}`);
      }
    } catch (error) {
      console.warn(
        `Could not load routes from system module ${moduleConfig.name}:`,
        error
      )
    }
  }

  return routes
}

// Function to load all routes (app + system)
export const loadAllRoutes = async () => {
  const [appRoutes, systemRoutes] = await Promise.all([
    loadAppRoutes(),
    loadSystemRoutes(),
  ])

  return [...appRoutes, ...systemRoutes]
}

// Function to load only menu items
export const loadMenuItems = async () => {
  const menuItems = []

  for (const moduleConfig of appModuleConfigs) {
    try {
      const routeModule = await moduleConfig.importModule()

      // Search for menu configuration in the same file
      const menuConfig = routeModule.menuConfig

      if (menuConfig) {
        menuItems.push({
          path: moduleConfig.path,
          name: moduleConfig.displayName,
          icon: moduleConfig.icon,
          moduleType: 'app',
          ...menuConfig, // Override with specific configuration
        })
      } else {
        // Default configuration
=======
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
>>>>>>> prod
        menuItems.push({
          path: moduleConfig.path,
          name: moduleConfig.displayName,
          icon: moduleConfig.icon,
<<<<<<< HEAD
          subItems: [],
          moduleType: 'app',
        })
      }
    } catch (error) {
      // If there's an error, use default configuration
=======
          subItems: []
        });
      }
    } catch (error) {
      // Si no existe menuConfig, usar configuración por defecto
>>>>>>> prod
      menuItems.push({
        path: moduleConfig.path,
        name: moduleConfig.displayName,
        icon: moduleConfig.icon,
<<<<<<< HEAD
        subItems: [],
        moduleType: 'app',
      })
      console.warn(`Error loading menu from module ${moduleConfig.name}:`, error)
    }
  }

  return menuItems
}

// Helper functions
export const getModuleByPath = (path) => {
  const allModules = [...appModuleConfigs, ...systemModuleConfigs]
  return allModules.find((module) => path.startsWith(module.path))
}

export const isSystemRoute = (path) => {
  return systemModuleConfigs.some((module) => path.startsWith(module.path))
}

export const getPublicRoutes = async () => {
  const systemRoutes = await loadSystemRoutes()
  return systemRoutes.filter((route) => route.requiresAuth === false)
}
=======
        subItems: []
      });
    }
  }
  
  return menuItems;
};
>>>>>>> prod

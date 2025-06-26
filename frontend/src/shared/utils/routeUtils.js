export const appModuleConfigs = [
  {
    name: 'analytics',
    displayName: 'Analytics',
    icon: '📊',
    path: '/analytics',
    importModule: () => import('../../modules/analytics/routes'),
  },
  {
    name: 'devices',
    displayName: 'Device Manager',
    icon: '📱',
    path: '/devices',
    importModule: () => import('../../modules/devices/routes'),
  },
  {
    name: 'proyects',
    displayName: 'Projects',
    icon: '📋',
    path: '/projects',
    importModule: () => import('../../modules/projects/routes'),
  },
  {
    name: 'organizations',
    displayName: 'Organizations',
    icon: '🏢',
    path: '/organizations',
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
        menuItems.push({
          path: moduleConfig.path,
          name: moduleConfig.displayName,
          icon: moduleConfig.icon,
          subItems: [],
          moduleType: 'app',
        })
      }
    } catch (error) {
      // If there's an error, use default configuration
      menuItems.push({
        path: moduleConfig.path,
        name: moduleConfig.displayName,
        icon: moduleConfig.icon,
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
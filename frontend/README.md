# ERP IoT - Frontend Monorepo

A specialized ERP system for comprehensive IoT device management, developed as a modular monorepo for maximum scalability and team collaboration.

## Overview

This project is the **main frontend** of the ERP IoT system, designed to manage IoT devices at scale. It's built as a **modular monorepo** where multiple specialized teams work independently on different modules, maintaining code coherence and reusability.

### Main Objective
Develop a scalable web platform that enables:
- Centralized IoT device management
- Real-time data analytics
- Organization and project administration
- Security and access control
- IoT device swarm management

---

## Project Architecture

### Modular Structure
```
src/
├── shared/                   # Shared code across all modules
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Shared custom hooks
│   ├── services/              # Common APIs and services
│   ├── context/               # Global contexts (Theme, etc.)
│   ├── utils/                 # General utilities including routing
│   └── types/                 # Common type definitions
├── modules/                  # Independent modules per team
│   ├── analytics/             # Analytics Team
│   │   ├── pages/             # Module pages/components
│   │   └── routes/            # Module routing configuration
│   │       ├── index.js       # Routes export
│   │       └── routeConfig.js # Route definitions
│   ├── devices/               # Device Manager Team
│   ├── organizations/         # Organizations Team
│   ├── projects/              # Projects Team
│   ├── security/              # Security Team
│   └── swarms/                # Swarm Manager Team
├── router/                   # Main routing configuration
│   └── AppRouter.jsx         # Root router with authentication
├── App.jsx                   # Root component
└── main.jsx                  # Entry point
```

### Development Philosophy
- **High-Scale Scalability**: Each module can grow independently
- **Separation of Concerns**: Each team has complete domain over their module
- **Shared Code**: Maximum reusability without duplications
- **Parallel Development**: Multiple teams working simultaneously without conflicts
- **Centralized Routing**: Unified routing system with per-module configuration

---

## Routing System Architecture

### Overview
The project implements a **modular routing system** that automatically loads routes from each module while maintaining independence between teams. The system uses **dynamic imports**, **lazy loading**, and **automatic route discovery** to create a scalable architecture.

### Core Philosophy
- **📦 Module Independence**: Each team manages their own routes
- **🔄 Dynamic Loading**: Routes loaded on-demand for performance
- **🔐 Authentication Layer**: Unified protection across all routes
- **📂 Auto-Configuration**: Minimal setup for new routes
- **🛠️ Developer Experience**: Easy debugging and development

### Key Components

#### 1. AppRouter (`src/router/AppRouter.jsx`)
- **Main router** with authentication protection
- **Lazy loading** of all module routes with React Suspense
- **Automatic route discovery** from module configurations
- **Layout management** (authenticated vs public routes)
- **Route separation** between app and system routes
- **Protected route wrapper** with simple localStorage authentication

```javascript
// Simple authentication check
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? children : <Navigate to="/home" replace />;
};

// Dynamic route loading and rendering
const initializeRoutes = async () => {
  const allRoutes = await loadAllRoutes();
  setRoutes(allRoutes);
};
```

#### 2. Route Utils (`src/shared/utils/routeUtils.js`)
- **Module configuration** registry with app and system modules
- **Dynamic route loading** from modules with error handling
- **Menu generation** from route definitions
- **Helper functions** for route management and path matching

```javascript
// Module registry
export const appModuleConfigs = [
  {
    name: 'analytics',
    displayName: 'Analytics',
    icon: '📊',
    path: '/analytics',
    importModule: () => import('../../modules/analytics/routes'),
  },
  // ... other modules
];

// Dynamic route loading with fallback
const getModuleRoutes = (routeModule, moduleName) => {
  if (routeModule.default) return routeModule.default;
  if (routeModule[`${moduleName}Routes`]) return routeModule[`${moduleName}Routes`];
  if (routeModule.routes) return routeModule.routes;
  return null;
};
```

#### 3. Route Loading Process
- **Parallel loading** of app and system routes
- **Error handling** with graceful degradation
- **Metadata injection** (moduleType, moduleName, permissions)
- **Menu configuration** extraction and processing

#### 3. Module Route Configuration

Each module follows this standardized structure:

```javascript
// modules/[module]/routes/routeConfig.js
export const MODULE_CONFIG = {
  basePath: '/analytics',
  name: 'analytics',
  displayName: 'Analytics',
  icon: '📊'
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
    permissions: ['analytics.read']
  }
];
```

```javascript
// modules/[module]/routes/index.js
import { MODULE_CONFIG, ROUTE_DEFINITIONS } from './routeConfig.js';

// Process and export routes for React Router
export const analyticsRoutes = routeDefinitions.map(route => ({
  path: route.path,
  element: <route.component />,
  requiresAuth: route.requiresAuth !== false,
  permissions: route.permissions,
  name: route.name
}));

// Export menu configuration
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
```

### Route Types

#### Application Routes (`app`)
- **Protected routes** requiring authentication
- **Wrapped in DefaultLayout** with sidebar and header
- **Module-specific functionality**

#### System Routes (`system`)
- **Public or authentication routes** (login, register)
- **No layout wrapper** (standalone pages)
- **Security and auth functionality**

### Adding New Routes

#### For Existing Modules
1. **Open** `modules/[your-module]/routes/routeConfig.js`
2. **Add** new route to `ROUTE_DEFINITIONS`:
   ```javascript
   {
     path: '/new-feature',
     component: NewFeatureComponent,
     name: 'New Feature',
     showInMenu: true,
     menuOrder: 3,
     requiresAuth: true,
     permissions: ['module.feature']
   }
   ```
3. **Import** your component at the top of the file
4. **Routes automatically appear** in menu and routing

#### For New Modules
1. **Create** module structure:
   ```
   modules/new-module/
   ├── pages/
   │   └── Dashboard.jsx
   ├── routes/
   │   ├── index.js
   │   └── routeConfig.js
   ```
2. **Add** module to `shared/utils/routeUtils.js`:
   ```javascript
   export const appModuleConfigs = [
     // ... existing modules
     {
       name: 'newmodule',
       displayName: 'New Module',
       icon: '🆕',
       path: '/new-module',
       importModule: () => import('../../modules/new-module/routes'),
     }
   ];
   ```
3. **Create** `routeConfig.js` following the established pattern
4. **Module automatically integrates** into the routing system

### Route Configuration Options

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `path` | `string` | Route path relative to module | ✅ |
| `component` | `Component` | React component to render | ✅ |
| `name` | `string` | Display name for menu | ✅ |
| `showInMenu` | `boolean` | Show in navigation menu | ❌ |
| `menuOrder` | `number` | Menu item order (default: 99) | ❌ |
| `isDefault` | `boolean` | Default route for module | ❌ |
| `requiresAuth` | `boolean` | Requires authentication (default: true) | ❌ |
| `permissions` | `string[]` | Required permissions | ❌ |

### Routing Features

- **🔄 Lazy Loading**: All routes loaded on-demand with React Suspense
- **🔐 Authentication**: Protected route system with localStorage check
- **📱 Responsive**: Mobile-friendly navigation with collapsible sidebar
- **🎯 Permission-based**: Route access control with role validation
- **📂 Auto-discovery**: Automatic menu generation from route configurations
- **⚡ Performance**: Optimized loading and rendering with code splitting
- **🛡️ Error Handling**: Graceful fallbacks for failed module loads
- **🔄 Hot Reload**: Development-friendly with instant route updates
- **📊 Debug Mode**: Console logging for route debugging in development

### Route Flow Architecture

```
User Navigation Request
         ↓
    AppRouter.jsx
         ↓
   Authentication Check
    (ProtectedRoute)
         ↓
   Route Type Detection
   (app vs system)
         ↓
    Layout Selection
   (DefaultLayout vs None)
         ↓
   Module Route Loading
   (Dynamic Import)
         ↓
    Component Rendering
   (with Suspense)
```

---

## Teams and Responsibilities

### **Analytics Team**
**Responsibilities:**
- Main dashboard with real-time metrics
- IoT device performance analysis
- Data reports and visualizations
- KPIs and automatic alerts

**Key Features:**
- Interactive dashboards
- Telemetry charts
- Predictive analytics
- Report exports

---

### **Device Manager Team**
**Responsibilities:**
- Individual IoT device management
- Configuration and parameterization
- Health and status monitoring
- OTA (Over The Air) updates

**Key Features:**
- Device inventory
- Remote configuration
- Real-time diagnostics
- Firmware management

---

### **Organizations Team**
**Responsibilities:**
- Organizational structure management
- User and role administration
- Permission configuration
- Multi-tenancy and data segregation

**Key Features:**
- Company/organization management
- Hierarchical structure
- User administration
- Organization-based access control

---

### **Projects Team**
**Responsibilities:**
- IoT project management
- Device assignment to projects
- Objective and KPI tracking
- Planning and resources

**Key Features:**
- Project creation and management
- Resource allocation
- Progress tracking
- Temporal planning

---

### **Security Team**
**Responsibilities:**
- Authentication and authorization
- Certificate and token management
- Security auditing and logs
- Access policies and compliance

**Key Features:**
- Authentication system
- Role and permission management
- Access auditing
- Security policies

---

### **Swarm Manager Team**
**Responsibilities:**
- Device group management (swarms)
- Coordination of related devices
- Mass deployments
- Group operation orchestration

**Key Features:**
- Swarm creation and management
- Mass operations
- Device coordination
- Group policies

---

## Technology Stack

### Frontend Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | `v20.12.2` | JavaScript runtime |
| **React** | `19.1.2` | UI library |
| **React Router** | `^6.x` | Navigation and routing |
| **Redux Toolkit** | `^2.x` | Global state management |

### Styling & UI
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | `^3.4.x` | Utility-first CSS framework |
| **Headless UI** | `^2.x` | Accessible components |
| **Heroicons** | `^2.x` | Iconography |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | `^5.x` | Build tool and dev server |
| **ESLint** | `^9.x` | Code linting |
| **Prettier** | `^3.x` | Code formatting |

### Testing (Coming Soon)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | `^1.x` | Testing framework |
| **Testing Library** | `^14.x` | React component testing |

---

## Quick Start

### Prerequisites
```bash
# Check versions
node --version  # Should be v20.12.2
npm --version   # v10.x.x recommended
```

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/erp-iot-frontend.git
cd erp-iot-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
# http://localhost:5173
```

### Available Scripts
```bash
# Development
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build

# Code quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting errors
npm run format       # Format code with Prettier

# Testing (coming soon)
npm run test         # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Test coverage
```

---

## Development Configuration

### Environment Variables
```bash
# .env.local
VITE_APP_TITLE="ERP IoT"
VITE_API_BASE_URL="http://localhost:8080/api"
VITE_WS_URL="ws://localhost:8080/ws"
VITE_ENVIRONMENT="development"
```

### Branch Structure
```
main                    # Main branch (production)
├── develop            # Development branch
├── feature/analytics  # Analytics team features
├── feature/devices    # Device Manager team features
├── feature/orgs       # Organizations team features
├── feature/projects   # Projects team features
├── feature/security   # Security team features
└── feature/swarm      # Swarm Manager team features
```

---

## Developer Guide

### Code Conventions
- **Components**: PascalCase (`DeviceCard.jsx`)
- **Hooks**: camelCase with "use" prefix (`useDeviceData.js`)
- **Services**: camelCase (`deviceService.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)
- **Routes**: Follow module's `routeConfig.js` pattern

### Workflow
1. **Create branch** from `develop`
2. **Develop** in your assigned module
3. **Follow** established modular structure
4. **Use shared/** for common code
5. **Add routes** to your module's `routeConfig.js`
6. **Create PR** towards `develop`
7. **Code review** by the team
8. **Merge** after approval

### Collaboration Rules
**Allowed:**
- Modify your module's code
- Use components from `shared/`
- Add routes to your module's configuration
- Propose changes to `shared/` via PR

**Not allowed:**
- Directly modify other modules' code
- Duplicate code that should be in `shared/`
- Import internal files from other modules
- Modify core routing system without team approval

---

## Backend Integration

### Microservices Architecture
Each frontend team consumes independent APIs:

```
Frontend Modules     ←→     Backend Services
├── analytics        ←→     analytics-service
├── devices          ←→     device-service
├── organizations    ←→     org-service
├── projects         ←→     project-service
├── security         ←→     auth-service
└── swarms           ←→     swarm-service
```

### Service Communication
- **HTTP/REST**: For CRUD operations

---

## Contributing

### For New Developers
1. Read this README completely
2. Understand the routing system architecture
3. Set up your development environment
4. Join your team's Slack channel
5. Request access to relevant backend repositories

### Reporting Issues
- Use provided issue templates
- Tag appropriately (bug, feature, enhancement)
- Assign to corresponding team

### Pull Requests
- Follow PR template
- Include tests (when available)
- Update documentation if necessary
- Request review from corresponding team

---

## Contact and Support

### Development Teams
- **Analytics**: 2022371156@uteq.edu.mx
- **Device Manager**: 
- **Organizations**: 
- **Projects**: 
- **Security**: 
- **Swarm Manager**: 2022371199@uteq.edu.mx

---

## License

This project is private property of IDGS10. All rights reserved.

---

**Ready to build the future of IoT?**

Welcome to the most ambitious IoT ERP development team in the market!

## ola
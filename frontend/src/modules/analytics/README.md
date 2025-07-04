# React Project Structure

This document explains the organization and purpose of each folder in our modular React project.

## General Architecture

The project is structured in **independent modules** that can be developed by different teams, with centralized shared code to maintain consistency and a **module-based routing system**.

```
src/
├── assets/          # Dependency-specific files
├── shared/          # Shared code between modules
├── modules/         # Independent modules per team
├── router/          # Route configuration
├── App.jsx          # Main component
└── main.jsx         # Entry point
```

---

## Module Structure

Each module follows a standardized structure that includes its own routing configuration:

```
modules/analytics/
├── components/      # Module-specific components
├── hooks/          # Module-specific hooks
├── pages/          # Module pages
├── routes/         # 🆕 Module routing configuration
│   ├── index.jsx   # Route processing and exports
│   └── routeConfig.js # Route definitions (USER EDITS HERE)
├── services/       # Module-specific APIs
├── store/          # Module-specific state (optional)
└── utils/          # Module-specific utilities (optional)
```

---

## 🆕 New Routing System

### `/routes` Folder
**Purpose:** Module-specific routing configuration with centralized management

**Key files:**
- `routeConfig.js` - **Main file to edit** - Contains all route definitions
- `index.jsx` - Processes routes and exports configurations (don't modify)

**What developers need to know:**
- **Only edit `routeConfig.js`** to add/modify routes
- Routes are automatically processed for React Router and menu generation
- Supports permissions, authentication, and menu configuration

**Example `routeConfig.js`:**
```javascript
import { lazy } from 'react';

// Lazy loading of components
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Reports = lazy(() => import('../pages/Reports.jsx'));

// Module configuration
export const MODULE_CONFIG = {
  basePath: '/analytics',
  name: 'analytics',
  displayName: 'Analytics',
  icon: '📊'
};

// ✨ Easy route configuration - DEVELOPERS ONLY MODIFY THIS
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
  },
  {
    path: '/reports',
    component: Reports,
    name: 'Reports',
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ['analytics.reports']
  }
];
```

**Route properties:**
- `path` - Relative path within the module
- `component` - React component to render
- `name` - Display name for menus
- `showInMenu` - Whether to show in navigation menu
- `menuOrder` - Order in menu (lower numbers first)
- `isDefault` - Default route for the module
- `requiresAuth` - Requires authentication
- `permissions` - Required permissions array

---

## Folder Descriptions

### `/components`
**Purpose:** Reusable React components

**What to include:**
- UI components (buttons, modals, forms)
- Layout components (header, sidebar, footer)
- Complex module-specific components

**Typical structure:**
```
components/
├── ChartContainer.jsx
├── ErrorMessage.jsx
├── LoadingSpinner.jsx
├── RecentActivity.jsx
└── StatsCard.jsx
```

**Example:**
```javascript
// StatsCard.jsx
const StatsCard = ({ title, value, trend, icon }) => {
  return (
    <div className="stats-card">
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__content">
        <h3>{title}</h3>
        <p className="stats-card__value">{value}</p>
        {trend && <span className={`trend trend--${trend.type}`}>{trend.value}</span>}
      </div>
    </div>
  );
};

export default StatsCard;
```

---

### `/hooks`
**Purpose:** Custom React hooks for reusable logic

**What to include:**
- Hooks for state management
- Hooks for API calls
- Hooks for specific business logic

**Examples:**
```javascript
// useAnalytics.js
export const useAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getDashboardData();
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  
  return { data, loading, error, refetch: fetchAnalytics };
};
```

---

### `/pages`
**Purpose:** Components that represent complete pages or main views

**What to include:**
- Main application pages
- Views that map directly to routes
- Containers that orchestrate multiple components

**Example:**
```javascript
// Dashboard.jsx
import { useAnalytics } from '../hooks/useAnalytics';
import StatsCard from '../components/StatsCard';
import ChartContainer from '../components/ChartContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Dashboard = () => {
  const { data, loading, error } = useAnalytics();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
      </header>
      
      <div className="stats-grid">
        {data?.stats?.map(stat => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>
      
      <div className="charts-section">
        <ChartContainer data={data?.charts} />
      </div>
    </div>
  );
};

export default Dashboard;
```

---

### `/services`
**Purpose:** Business logic, APIs and external services

**What to include:**
- API configuration and calls
- Data transformation utilities
- Third-party service integrations
- Business logic functions

**Example:**
```javascript
// analyticsService.js
import { api } from '../../../shared/services/api';

export const analyticsService = {
  getDashboardData: () => api.get('/analytics/dashboard'),
  
  getReports: (filters = {}) => 
    api.get('/analytics/reports', { params: filters }),
  
  getMetrics: (dateRange) => 
    api.get('/analytics/metrics', { params: { ...dateRange } }),
  
  exportReport: (reportId, format = 'pdf') => 
    api.get(`/analytics/reports/${reportId}/export`, { 
      params: { format },
      responseType: 'blob'
    }),
  
  // Data transformation
  transformDashboardData: (rawData) => ({
    stats: rawData.statistics?.map(stat => ({
      id: stat.id,
      title: stat.name,
      value: stat.value,
      trend: {
        type: stat.change > 0 ? 'up' : 'down',
        value: `${Math.abs(stat.change)}%`
      }
    })) || [],
    charts: rawData.charts || []
  })
};
```

---

## Best Practices

### 1. **Naming Conventions**
- Components: PascalCase (`StatsCard.jsx`)
- Hooks: camelCase with "use" prefix (`useAnalytics.js`)
- Pages: PascalCase (`Dashboard.jsx`)
- Services: camelCase (`analyticsService.js`)
- Routes: camelCase (`routeConfig.js`)

### 2. **Module Independence**
Each module should be self-contained and follow the standard structure:
- Use shared resources through imports from `../../../shared/`
- Keep module-specific logic within the module
- Export necessary configurations from routes

### 3. **Route Configuration**
- **Only modify `routeConfig.js`** for adding/changing routes
- Use lazy loading for all page components
- Configure permissions and authentication at route level
- Use descriptive names and proper menu ordering

### 4. **Component Organization**
- Keep components focused and single-purpose
- Use composition over inheritance
- Implement proper error boundaries
- Follow consistent prop patterns

---

## Getting Started with a New Module

1. **Create the module structure** following the standard layout
2. **Configure your routes** in `routes/routeConfig.js`:
   - Set up MODULE_CONFIG with basePath and display info
   - Define ROUTE_DEFINITIONS with your pages
3. **Create your pages** in the `pages/` folder
4. **Build components** in the `components/` folder
5. **Add business logic** in `services/` and `hooks/`
6. **Register the module** in the main router configuration

### Quick Start Template:
```javascript
// routes/routeConfig.js
export const MODULE_CONFIG = {
  basePath: '/your-module',
  name: 'yourModule',
  displayName: 'Your Module',
  icon: '🚀'
};

export const ROUTE_DEFINITIONS = [
  {
    path: '/',
    component: YourMainPage,
    name: 'Main',
    showInMenu: true,
    menuOrder: 1,
    isDefault: true,
    requiresAuth: true
  }
];
```

---

## Migration from Old Structure

If you have an existing module without the routes folder:

1. Create `routes/` folder in your module
2. Copy the template `routeConfig.js` and `index.jsx`
3. Configure your routes in `routeConfig.js`
4. Update your page imports to use lazy loading
5. Remove old route configurations from central router

---

Have questions about the routing system or any specific folder? Consult with the team!
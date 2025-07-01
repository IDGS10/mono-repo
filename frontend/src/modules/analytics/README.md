# React Project Structure

This document explains the organization and purpose of each folder in our modular React project.

## General Architecture


The project is structured in **independent modules** that can be developed by different teams, with centralized shared code to maintain consistency.


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

<<<<<<< HEAD
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

├── Button/
│   ├── Button.jsx
│   ├── Button.module.css
│   └── index.js
└── Modal/
    ├── Modal.jsx
    ├── Modal.module.css
    └── index.js

```

**Example:**
```javascript

// Button/Button.jsx
const Button = ({ children, variant = 'primary', onClick, ...props }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;

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
<<<<<<< HEAD
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

// useApi.js - Generic hook for APIs
export const useApi = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Hook logic...
  
  return { data, loading, refetch };
};

// useAuth.js - Hook for authentication
export const useAuth = () => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  
  const login = (credentials) => {
    // Login logic...
  };
  
  return { user, login, logout };

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
<<<<<<< HEAD
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

// DashboardPage.jsx
const DashboardPage = () => {
  const { data } = useAnalytics();
  
  return (
    <div className="dashboard-page">
      <Header title="Dashboard" />
      <StatsCards data={data} />
      <ChartsSection data={data} />
    </div>
  );
};

```

---

### `/services`
**Purpose:** Business logic, APIs and external services

**What to include:**
<<<<<<< HEAD
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
=======
- API configuration (axios, fetch)
- Functions for HTTP calls
- Third-party services
- Data transformation utilities

**Example:**
```javascript
// api.js - Base configuration
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// userService.js - Specific service
export const userService = {
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};
```

---

### `/store`
**Purpose:** Global application state management

**What to include:**
- Store configuration (Redux, Zustand, Context)
- Specific slices/reducers
- Actions and selectors
- Custom middleware

**With Redux Toolkit:**
```javascript
// store.js
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    users: usersSlice.reducer,
  },
});

// userSlice.js
export const usersSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    loading: false,
  },
  reducers: {
    setUsers: (state, action) => {
      state.list = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});
```

---

### `/utils`
**Purpose:** Utility functions and general helpers

**What to include:**
- Formatting functions
- Validators
- Constants
- Mathematical or text helpers

**Example:**
```javascript
// formatters.js
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US');
};

// validators.js
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// constants.js
export const API_ENDPOINTS = {
  USERS: '/users',
  PRODUCTS: '/products',
  ORDERS: '/orders',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',

};
```

---

## Best Practices

### 1. **Naming Conventions**
<<<<<<< HEAD
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
=======
- Components: PascalCase (`UserCard.jsx`)
- Hooks: camelCase with "use" prefix (`useUserData.js`)
- Pages: PascalCase (`Home.jsx`)
- Services: camelCase (`userService.js`)
- Utils: camelCase (`formatUtils.js`)

### 2. **Module Organization**
Each module should be self-contained:
```
modules/analytics/
├── components/    # Module-specific components
├── hooks/         # Module-specific hooks
├── pages/         # Module pages
├── services/      # Module-specific APIs
├── store/         # Module-specific state
└── utils/         # Module-specific utilities
```

### 3. **Separation of Responsibilities**
- **Components:** Only UI and presentation
- **Hooks:** Reusable logic and state
- **Services:** API communication
- **Utils:** Pure functions without React dependencies

---

## Getting Started

1. **Locate your module** in the `modules/` folder
2. **Create the folder structure** according to your needs
3. **Use shared/** for common code between modules
4. **Follow established** naming conventions

---

Have questions about any specific folder? Consult with the team!

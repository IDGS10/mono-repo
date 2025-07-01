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
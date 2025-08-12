// modules/organizations/routes/routeConfig.js
import { lazy } from "react";

// Lazy loading components for better performance (code splitting)
const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const CreateOrganization = lazy(() =>
  import("../pages/CreateOrganization.jsx")
);
const EditOrganization = lazy(() => import("../pages/EditOrganization.jsx"));
const OrganizationList = lazy(() => import("../pages/OrganizationList.jsx"));
const OrganizationDetail = lazy(() =>
  import("../pages/OrganizationDetail.jsx")
);
const Members = lazy(() => import("../pages/Members.jsx"));
const AcceptInvitation = lazy(() =>
  import("../components/AcceptInvitation.jsx")
);

// Module configuration constants
export const MODULE_CONFIG = {
  basePath: "/organizations", // Base URL path for all routes in this module
  name: "organizations", // Internal module identifier
  displayName: "Organizations", // User-friendly name for UI display
  icon: "🏢", // Icon to represent this module in menus
};

// Route configuration array
// Each object defines a route with its properties
export const ROUTE_DEFINITIONS = [
  {
    path: "/", // Root path of the module
    component: Dashboard, // Component to render
    name: "Dashboard", // Route name for identification
    showInMenu: true, // Whether to show in navigation menu
    menuOrder: 1, // Position in menu (lower numbers appear first)
    isDefault: true, // Mark as default route for this module
    requiresAuth: true, // Requires authenticated user
    permissions: ["organizations.read"], // Required permissions to access
  },
  {
    path: "/create",
    component: CreateOrganization,
    name: "Create Organization",
    showInMenu: false, // Hidden from menu (typically accessed via action button)
    requiresAuth: true,
    permissions: ["organizations.create", "organizations.owner"], // Higher privileges required
  },
  {
    path: "/:id/edit", // Dynamic route with ID parameter
    component: EditOrganization,
    name: "Edit Organization",
    showInMenu: false, // Hidden from menu (typically accessed via action)
    requiresAuth: true,
    permissions: ["organizations.update", "organizations.owner"],
  },
  {
    path: "/list",
    component: OrganizationList,
    name: "Organizations",
    showInMenu: true,
    menuOrder: 2,
    requiresAuth: true,
    permissions: ["organizations.read"],
  },
  {
    path: "/members",
    component: Members,
    name: "Members",
    showInMenu: true,
    menuOrder: 3,
    requiresAuth: true,
    permissions: ["organizations.members"], // Specific permission for members section
  },
  {
    path: "/organization/:id", // Dynamic route for organization details
    component: OrganizationDetail,
    name: "Organization Detail",
    showInMenu: false, // Typically accessed via link, not directly from menu
    requiresAuth: true,
    permissions: ["organizations.read"],
  },
  {
    path: "/components/acceptinvitation/:token", // Route with token parameter
    component: AcceptInvitation,
    name: "Accept Invitation",
    showInMenu: false, // Special route not shown in menu
    requiresAuth: false, // Public route (accessible without authentication)
    permissions: [], // No permissions required
  },
];
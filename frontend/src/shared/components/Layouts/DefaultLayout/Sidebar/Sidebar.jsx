import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadMenuItems } from '../../../../utils/routeUtils';
import { useTheme } from '../../../../context/ThemeContext';
import MenuItem from './MenuItem';

const Sidebar = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme(); // ✨ Global theme usage
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);

  // Load menu
  useEffect(() => {
    const initializeMenu = async () => {
      try {
        const items = await loadMenuItems();
        setMenuItems(items);

        // Auto-expand active menu
        const activeItem = items.find((item) =>
          location.pathname.startsWith(item.path)
        );
        if (activeItem && activeItem.subItems?.length > 0) {
          setExpandedMenu(activeItem.path);
        }
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMenu();
  }, [location.pathname]); // ← Only when route changes

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleMenuClick = (item) => {
    // If it has submenus
    if (item.subItems?.length > 0) {
      // If it was already expanded, collapse
      if (expandedMenu === item.path) {
        setExpandedMenu(null);
      } else {
        // Expand this menu (automatically closes the previous one)
        setExpandedMenu(item.path);
      }

      // Navigate to the module's main route
      navigate(item.path);
    }
    // If it has no submenus, just navigate
    else {
      navigate(item.path);
    }
  };

  const isMenuExpanded = (path) => {
    return expandedMenu === path;
  };

  if (loading) {
    return (
      <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ease-in-out shadow-lg ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ease-in-out shadow-lg ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            My Dashboard
          </h1>
        )}
        <button
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-lg transition-transform duration-200">
            {sidebarCollapsed ? '→' : '←'}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <MenuItem
              key={item.path}
              item={item}
              sidebarCollapsed={sidebarCollapsed}
              isActiveRoute={isActiveRoute}
              isExpanded={isMenuExpanded(item.path)}
              onMenuClick={handleMenuClick}
            />
          ))}
        </div>
      </nav>

      {/* Theme Toggle */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <span className="text-lg mr-3">{darkMode ? '☀️' : '🌙'}</span>
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import UserProfile from './UserProfile';

const TopHeader = ({ sidebarCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme(); // ✨ Global theme usage

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');

    // Redirect to login
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {location.pathname.split('/').filter(Boolean).join(' / ') || 'Home'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle for collapsed sidebar */}
          {sidebarCollapsed && (
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          )}

          {/* Notifications */}
          <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 relative">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200">
            ⚙️
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200"
            title="Sign out"
          >
            🚪
          </button>

          {/* User Profile */}
          <UserProfile />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
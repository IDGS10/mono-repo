import { Link, useLocation } from 'react-router-dom';

const MenuItem = ({ 
  item, 
  sidebarCollapsed, 
  isActiveRoute, 
  isExpanded, 
  onMenuClick 
}) => {
  const location = useLocation();

  return (
    <div>
      {/* Main Menu Item */}
      <div className="relative">
        <button
          onClick={() => onMenuClick(item)}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group text-left ${
            isActiveRoute(item.path)
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
          title={sidebarCollapsed ? item.name : ''}
        >
          {/* Active indicator */}
          {isActiveRoute(item.path) && (
            <div className="absolute left-0 top-0 h-full w-1 bg-blue-600 dark:bg-blue-400 rounded-r-full"></div>
          )}

          <span className="text-lg flex-shrink-0 transform transition-transform duration-200 group-hover:scale-110">
            {item.icon}
          </span>

          {!sidebarCollapsed && (
            <>
              <span className="ml-3 truncate transition-all duration-200">
                {item.name}
              </span>
              {item.subItems && item.subItems.length > 0 && (
                <span
                  className={`ml-auto text-xs text-gray-400 dark:text-gray-500 transition-transform duration-300 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                >
                  ▶
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Submenu with animation */}
      {!sidebarCollapsed && item.subItems && item.subItems.length > 0 && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mt-1 ml-6 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
            {item.subItems.map((subItem, index) => (
              <Link
                key={subItem.path}
                to={subItem.path}
                className={`block px-3 py-2 text-sm rounded-md transition-all duration-200 hover:translate-x-1 ${
                  location.pathname === subItem.path
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-medium shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-current opacity-40 mr-2"></span>
                  {subItem.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItem;
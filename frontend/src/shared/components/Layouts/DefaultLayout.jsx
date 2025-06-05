// shared/components/Layouts/DefaultLayout.jsx - ACTUALIZADO
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { loadMenuItems } from '../../utils/routeUtils';

const DefaultLayout = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeMenu = async () => {
      try {
        const items = await loadMenuItems();
        setMenuItems(items);
      } catch (error) {
        console.error('Error cargando menú:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMenu();
  }, []);

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Always visible on desktop */}
      <aside className={`bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-semibold text-gray-900">
              Mi Dashboard
            </h1>
          )}
          <button 
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
          >
            <span className="text-lg">{sidebarCollapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 group ${
                    isActiveRoute(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                  {!sidebarCollapsed && item.subItems && item.subItems.length > 0 && (
                    <span className="ml-auto text-xs text-gray-400">
                      {isActiveRoute(item.path) ? '▼' : '▶'}
                    </span>
                  )}
                </Link>
                
                {/* Submenu - Only show when not collapsed and route is active */}
                {!sidebarCollapsed && item.subItems && item.subItems.length > 0 && isActiveRoute(item.path) && (
                  <div className="mt-1 ml-6 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`block px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                          location.pathname === subItem.path
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {location.pathname.split('/').filter(Boolean).join(' / ') || 'Home'}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200">
                🔔
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200">
                ⚙️
              </button>
              
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Usuario</div>
                  <div className="text-xs text-gray-500">Administrador</div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  👤
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DefaultLayout;
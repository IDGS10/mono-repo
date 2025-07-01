// router/AppRouter.jsx - WITH SIMPLE AUTHENTICATION
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { loadAllRoutes } from '../shared/utils/routeUtils';
import DefaultLayout from '../shared/components/Layouts/DefaultLayout';
import LoadingSpinner from '../shared/components/LoadingSpinner';

// Simple component to protect routes
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return children;
};

export const AppRouter = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeRoutes = async () => {
      try {
        const allRoutes = await loadAllRoutes();
        setRoutes(allRoutes);
        console.log('Routes loaded:', allRoutes); // For debugging
      } catch (error) {
        console.error('Error loading routes:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeRoutes();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading application..." />;
  }

  // Separate routes by type
  const appRoutes = routes.filter(route => route.moduleType === 'app');
  const systemRoutes = routes.filter(route => route.moduleType === 'system');

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root based on authentication */}
        <Route 
          path="/" 
          element={
            localStorage.getItem('isLoggedIn') === 'true' 
              ? <Navigate to="/analytics" replace />
              : <Navigate to="/auth/login" replace />
          } 
        />

        {/* System routes - Without layout (login, register, etc.) */}
        {systemRoutes.map((route, index) => (
          <Route 
            key={`system-${route.path}-${index}`} 
            path={route.path}
            element={
              <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                {route.element}
              </Suspense>
            }
          />
        ))}

        {/* Application routes - With DefaultLayout and protected */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DefaultLayout />
            </ProtectedRoute>
          }
        >
          {/* Application module routes */}
          {appRoutes.map((route, index) => (
            <Route 
              key={`app-${route.path}-${index}`} 
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
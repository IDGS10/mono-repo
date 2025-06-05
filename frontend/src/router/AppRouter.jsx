// router/AppRouter.jsx - ACTUALIZADO
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { loadAllRoutes } from '../shared/utils/routeUtils';
import DefaultLayout from '../shared/components/Layouts/DefaultLayout';
import LoadingSpinner from '../shared/components/LoadingSpinner';

export const AppRouter = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeRoutes = async () => {
      try {
        const allRoutes = await loadAllRoutes();
        setRoutes(allRoutes);
      } catch (error) {
        console.error('Error cargando rutas:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeRoutes();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Cargando aplicación..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          {/* Rutas cargadas dinámicamente */}
          {routes.map((route, index) => (
            <Route 
              key={`${route.path}-${index}`} 
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner message="Cargando página..." />}>
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
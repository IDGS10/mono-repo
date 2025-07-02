import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Selecciona el elemento root
const container = document.getElementById('root');
const root = createRoot(container);

// Renderiza tu aplicación
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
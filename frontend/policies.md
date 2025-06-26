# Políticas de Desarrollo Frontend - ERP IoT

## Resumen General

Este documento establece las políticas y estándares de desarrollo para el monorepo frontend del ERP IoT. Estas políticas aseguran consistencia, mantenibilidad y colaboración efectiva entre múltiples equipos trabajando en diferentes módulos.

## Arquitectura y Políticas Modulares

### Reglas de Independencia Modular

**PERMITIDO:**
- Modificar archivos dentro de tu módulo asignado (`modules/[tu-modulo]/`)
- Usar cualquier componente, hook o utilidad de `shared/`
- Crear implementaciones específicas del módulo
- Agregar nuevas dependencias que no conflicten con las existentes

**PROHIBIDO:**
- Importaciones directas desde otros módulos (`modules/[otro-modulo]/`)
- Modificar archivos fuera de tu módulo sin aprobación
- Crear funcionalidad compartida dentro de tu módulo
- Cambios breaking a `shared/` sin consenso del equipo

### Política de Código Compartido

**Agregar a `shared/`:**
1. Crear Pull Request con explicación detallada
2. Obtener aprobación de al menos 2 líderes de equipo
3. Asegurar compatibilidad hacia atrás
4. Agregar documentación completa
5. Realizar pruebas unitarias

**Modificar `shared/`:**
- Requiere aprobación de TODOS los equipos afectados
- Debe mantener compatibilidad hacia atrás
- Cambios breaking necesitan plan de migración
- Actualizar todos los módulos dependientes

---

### Estándares de Estructura de Archivos

**Estructura de Componentes:**
```javascript
// ComponentName.jsx
import React from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  // Lógica del componente
  
  return (
    <div className="tailwind-className">
      {/* Contenido JSX */}
    </div>
  );
};

export default ComponentName;
```

**Estructura de Servicios:**
```javascript
// moduleService.js
import { api } from '@/shared/services/api';

export const moduleService = {
  // Operaciones CRUD
  getAll: () => api.get('/module'),
  getById: (id) => api.get(`/module/${id}`),
  create: (data) => api.post('/module', data),
  update: (id, data) => api.put(`/module/${id}`, data),
  delete: (id) => api.delete(`/module/${id}`),
  
  // Operaciones específicas
  customOperation: (params) => api.post('/module/custom', params),
};
```

### Estándares de Import/Export

**Orden de Imports:**
1. React y relacionados con React
2. Librerías de terceros
3. Utilidades/componentes compartidos
4. Imports específicos del módulo
5. Imports relativos

```javascript
// Orden correcto
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { Button, Modal } from '@/shared/components';
import { formatDate } from '@/shared/utils';

import { useAnalytics } from '../hooks/useAnalytics';
import './Dashboard.css';
```

**Estándares de Export:**
```javascript
// Preferido - Export default para componente principal
export default Dashboard;

// Named exports para utilidades
export { formatData, validateInput };

// Re-exports en archivos index
export { default as Dashboard } from './Dashboard';
export { default as Reports } from './Reports';
```

---

## Políticas de UI y Componentes

### Estándares de Tailwind CSS

**Organización de Clases:**
```javascript
// Correcto - Agrupación lógica
className="
  flex items-center justify-between
  w-full h-12 px-4 py-2
  bg-white border border-gray-200 rounded-lg
  text-sm font-medium text-gray-900
  hover:bg-gray-50 focus:outline-none focus:ring-2
  transition-colors duration-200
"
```

**Diseño Responsivo:**
```javascript
// Enfoque mobile-first
className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4"
```

### Reutilización de Componentes

**Política de Componentes Compartidos:**
- Deben ser altamente reutilizables entre módulos
- Incluir PropTypes/TypeScript completos
- Seguir guías de accesibilidad
- Incluir documentación de Storybook (cuando esté disponible)

**Política de Componentes del Módulo:**
- Pueden ser específicos del módulo
- Deben seguir los mismos estándares de calidad
- Considerar promover a compartido si es reutilizable

---

## Políticas de API y Servicios

### Estándares de Servicios

**Configuración Base de API:**
```javascript
// shared/services/api.js
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);
```

### Estándares de Manejo de Errores

**Nivel de Servicio:**
```javascript
export const deviceService = {
  getDevices: async () => {
    try {
      const response = await api.get('/devices');
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
};
```

**Nivel de Componente:**
```javascript
const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDevices = async () => {
      const { data, error } = await deviceService.getDevices();
      if (error) {
        setError(error);
      } else {
        setDevices(data);
      }
    };
    
    fetchDevices();
  }, []);
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return <div>{/* Renderizar dispositivos */}</div>;
};
```

---

## Políticas de Performance

**Optimización de Assets:**
- Imágenes: Usar formato WebP cuando sea posible
- Iconos: Preferir SVG sobre PNG
- Fonts: Usar fuentes del sistema o precargar fuentes personalizadas

---

## Políticas de Seguridad

### Autenticación y Autorización

**Gestión de Tokens:**
```javascript
// Almacenamiento seguro de tokens
const storeToken = (token) => {
  // Usar cookies httpOnly en producción
  document.cookie = `token=${token}; httpOnly; secure; sameSite=strict`;
};

// Evitar localStorage para datos sensibles
localStorage.setItem('token', token); // No hacer esto
```

**Variables de Entorno:**
```bash
# Prefijo para variables públicas
VITE_APP_NAME=ERP_IoT
VITE_API_BASE_URL=https://api.example.com

# Nunca exponer secretos
VITE_SECRET_KEY=xxx # No hacer esto

---

## Estándares de Documentación

### Requisitos de README

**Template de README de Módulo:**
```markdown
# Nombre del Módulo

## Resumen
Breve descripción del propósito del módulo

## Funcionalidades
- Funcionalidad 1
- Funcionalidad 2

## Componentes
Lista de componentes principales

## Integración de API
Descripción de los servicios backend utilizados

## Primeros Pasos
Instrucciones de configuración específicas para este módulo

## Testing
Cómo ejecutar las pruebas para este módulo
```

### Documentación de Código

**Documentación de Componentes:**
```javascript
/**
 * Componente DeviceCard para mostrar información de dispositivo
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.device - Objeto de datos del dispositivo
 * @param {string} props.device.id - Identificador único del dispositivo
 * @param {string} props.device.name - Nombre del dispositivo
 * @param {Function} props.onEdit - Callback para acción de editar
 * @param {Function} props.onDelete - Callback para acción de eliminar
 * @returns {JSX.Element} Tarjeta de dispositivo renderizada
 */
const DeviceCard = ({ device, onEdit, onDelete }) => {
  // Implementación del componente
};
```

---

## Políticas de Deployment y Entornos

### Configuración de Entornos

**Archivos de Entorno:**
```bash
# .env.development
VITE_APP_TITLE="ERP IoT - Development"
VITE_API_BASE_URL="http://localhost:8080/api"
VITE_ENVIRONMENT="development"

# .env.production
VITE_APP_TITLE="ERP IoT"
VITE_API_BASE_URL="https://api.erp-iot.com/api"
VITE_ENVIRONMENT="production"
```

### Estándares de Build

**Comandos de Build:**
```bash
# Build de desarrollo
npm run build:dev

# Build de producción
npm run build:prod

# Análisis de build
npm run build:analyze
```

---

## Políticas de Comunicación de Equipos

### Comunicación de Cambios

**Cambios Breaking:**
1. Anunciar en canal de equipo 48h antes de implementación
2. Documentar guía de migración
3. Proporcionar compatibilidad hacia atrás cuando sea posible
4. Programar reunión de equipo si es necesario

**Nuevas Funcionalidades:**
1. Actualizar README del módulo
2. Agregar a showcase/demo del equipo
3. Documentar en changelog

### Proceso de Code Review

**Requisitos de Review:**
- Al menos 1 aprobación de miembro del equipo
- Sin comentarios bloqueantes
- Todas las verificaciones pasando (tests, linting)
- Documentación actualizada

**Checklist de Review:**
- [ ] El código sigue estándares establecidos
- [ ] Sin problemas de performance
- [ ] Consideraciones de seguridad atendidas
- [ ] Tests agregados/actualizados
- [ ] Documentación completa

---

## Monitoreo y Calidad

### Métricas de Calidad de Código

**Reglas de ESLint:**
- Sin variables no utilizadas
- Comillas consistentes (simples)
- Sin console.log en producción
- Estructura adecuada de import/export

**Monitoreo de Performance:**
```javascript
// Seguimiento de performance
const trackComponentMount = (componentName) => {
  performance.mark(`${componentName}-start`);
  
  useEffect(() => {
    performance.mark(`${componentName}-end`);
    performance.measure(
      `${componentName}-mount`, 
      `${componentName}-start`, 
      `${componentName}-end`
    );
  }, []);
};
```

---

## Violaciones y Cumplimiento

### Violaciones de Políticas

**Violaciones Menores:**
- Problemas de estilo de código
- Documentación faltante
- Nomenclatura inconsistente

**Violaciones Mayores:**
- Romper contratos compartidos
- Vulnerabilidades de seguridad
- Regresiones de performance
- Cambios breaking sin aviso

### Proceso de Cumplimiento

1. **Automatizado:** Verificaciones de ESLint, Prettier, CI/CD
2. **Code Review:** Proceso de revisión por pares
3. **Revisión de Líder de Equipo:** Para problemas complejos
4. **Discusión de Equipo:** Para actualizaciones de políticas

---

## Soporte y Contacto

### Contactos de Equipos

| Equipo | Líder | Contacto |
|--------|-------|----------|
| **Analytics** | TBD | 2022371156@uteq.edu.mx |
| **Device Manager** | TBD | TBD |
| **Organizations** | TBD | TBD |
| **Projects** | TBD | TBD |
| **Security** | TBD | TBD |
| **Swarm Manager** | TBD | 2022371199@uteq.edu.mx |

### Actualizaciones de Políticas

Este documento es dinámico y se actualizará conforme evolucione el proyecto. Todos los cambios se comunicarán a través de:
- Anuncios de equipo
- Mensajes de commit de Git
- Actualizaciones de documentación

---

**Última Actualización:** Junio 2025  
**Versión:** 1.0.0

---

*Estas políticas están diseñadas para asegurar código de alta calidad y mantenible mientras permiten colaboración eficiente entre equipos. Cuando tengas dudas, prioriza la comunicación de equipo y la claridad del código.*
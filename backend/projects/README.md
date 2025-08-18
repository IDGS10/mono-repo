# 🏗️ Projects Service - Microservicio de Gestión de Proyectos

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express-4.18.2-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15+-blue.svg)](https://postgresql.org/)
[![JWT](https://img.shields.io/badge/auth-JWT-orange.svg)](https://jwt.io/)
[![Shared Middleware](https://img.shields.io/badge/middleware-shared-green.svg)](https://github.com/mono-repo/shared-middleware)

Microservicio especializado en la gestión de proyectos dentro del ecosistema mono-repo. Proporciona una API REST segura para crear, gestionar y monitorear proyectos con autenticación JWT y validación robusta.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [API Endpoints](#-api-endpoints)
- [Autenticación](#-autenticación)
- [Base de Datos](#-base-de-datos)
- [Desarrollo](#-desarrollo)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

## ✨ Características

### 🔐 **Seguridad Avanzada**
- **Autenticación JWT** con validación en base de datos
- **CORS restrictivo** configurado por orígenes
- **Rate limiting** para prevenir abuso de API
- **Headers de seguridad** con Helmet.js
- **Sanitización de inputs** automática
- **Validación de permisos** por roles de usuario

### 🎯 **Gestión de Proyectos**
- **IDs únicos** de 8 dígitos (no consecutivos)
- **Estados de proyecto**: pending_approval, approved, rejected, completed
- **Paginación obligatoria** (máximo 100 registros por página)
- **Búsqueda y filtros** avanzados
- **Estadísticas** en tiempo real
- **Auditoría completa** de cambios

### 🏗️ **Arquitectura Moderna**
- **Middleware compartido** estandarizado
- **Respuestas API** consistentes
- **Logging centralizado** con métricas
- **Manejo de errores** robusto
- **Conexión con pool** PostgreSQL optimizado
- **Graceful shutdown** implementado

### 🔗 **Integración Ecosistema**
- **Conexión Swarms API** para dispositivos
- **API Organizaciones** para gestión empresarial
- **Frontend compatible** con React/Vite
- **Validación MAC addresses** para dispositivos

## 🏛️ Arquitectura

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend React    │────│  Projects Service   │────│   PostgreSQL DB     │
│   (Port 5173)       │    │   (Port 3001)       │    │   (Port 5432)       │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                       │
                           ┌───────────┼───────────┐
                           │                       │
                 ┌─────────────────────┐  ┌─────────────────────┐
                 │   Swarms API        │  │ Organizations API   │
                 │ (74.208.137.35:5052)│  │   (Port 3002)       │
                 └─────────────────────┘  └─────────────────────┘
```

### **Componentes Principales**
- **Controllers**: Lógica de negocio y validaciones
- **Models**: Interacción con base de datos y entidades
- **Routes**: Definición de endpoints y middleware
- **Middleware**: Autenticación, validación y seguridad
- **Config**: Configuración de base de datos y variables

## 🚀 Instalación

### **Prerrequisitos**
- Node.js >= 18.0.0
- PostgreSQL >= 15
- npm >= 8.0.0
- Acceso al paquete `@mono-repo/shared-middleware`

### **1. Clonar e Instalar**
```bash
# Clonar el repositorio
git clone <repository-url>
cd projects-service

# Instalar dependencias
npm install

# Instalar middleware compartido
npm install file:../shared/middleware-package
```

### **2. Configurar Base de Datos**
```sql
-- Crear base de datos
CREATE DATABASE projectsDatabase;

-- Crear usuario
CREATE USER projectsGroup WITH PASSWORD 'projects2025';
GRANT ALL PRIVILEGES ON DATABASE projectsDatabase TO projectsGroup;

-- Crear tabla projects
\c projectsDatabase;

CREATE TABLE projects (
    id_project INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending_approval' 
        CHECK (status IN ('pending_approval', 'approved', 'rejected', 'completed')),
    created_by INTEGER NOT NULL,
    modified_by INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    id_org INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_org ON projects(id_org);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

## ⚙️ Configuración

### **Variables de Entorno (.env)**
```env
# === CONFIGURACIÓN PRINCIPAL ===
NODE_ENV=development
PORT=3001
API_VERSION=2.0.0

# === JWT AUTHENTICATION ===
JWT_SECRET=tu-jwt-secret-super-seguro-aqui-minimo-256-bits

# === BASE DE DATOS ===
DB_HOST=74.208.137.35
DB_PORT=5432
DB_NAME=projectsDatabase
DB_USER=projectsGroup
DB_PASSWORD=projects2025

# === SEGURIDAD Y CORS ===
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# === APIS EXTERNAS ===
SWARMS_API_URL=http://74.208.137.35:5052
ORGANIZATIONS_API_URL=http://localhost:3002

# === OPCIONAL ===
LOG_LEVEL=info
ENABLE_METRICS=true
```

### **Configuración del Middleware**
```javascript
const middleware = createMiddleware({
  serviceName: 'projects-service',
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN?.split(','),
  rateLimitMax: 100,
  sessionTimeout: '24h',
  enableMetrics: true
})
```

## 📡 API Endpoints

### **🌐 Rutas Públicas (No requieren JWT)**

#### `GET /health`
Health check del servicio
```json
{
  "success": true,
  "message": "Health check completed",
  "data": {
    "status": "healthy",
    "database": "connected",
    "service": "projects-service",
    "uptime": 3600
  }
}
```

#### `GET /` 
Información general de la API
```json
{
  "success": true,
  "message": "Projects API - Secure Version", 
  "data": {
    "version": "2.0.0",
    "endpoints": { "projects": "ALL /projects/* (JWT required)" }
  }
}
```

#### `GET /test-token` (Solo desarrollo)
Generar JWT de prueba
```bash
curl "http://localhost:3001/test-token?userId=1&username=testuser&role=Owner"
```

### **🔒 Rutas Protegidas (Requieren JWT)**

Todas las rutas bajo `/projects` requieren header de autorización:
```
Authorization: Bearer <jwt-token>
```

#### **Gestión de Proyectos**

##### `GET /projects`
Listar proyectos con paginación
```bash
# Parámetros opcionales
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/projects?page=1&limit=10&status=approved&ownerId=1"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": {
    "projects": [
      {
        "id_project": 12345678,
        "name": "Proyecto Demo",
        "description": "Descripción del proyecto",
        "status": "approved",
        "owner_id": 1,
        "created_at": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "hasNext": true
    },
    "count": 10
  }
}
```

##### `POST /projects`
Crear nuevo proyecto (genera ID único automáticamente)
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Proyecto",
    "description": "Descripción detallada",
    "location": "Madrid, España",
    "id_org": 1
  }' \
  http://localhost:3001/projects
```

##### `GET /projects/:id`
Obtener proyecto específico
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/projects/12345678
```

##### `PUT /projects/:id`
Actualizar proyecto
```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nombre Actualizado", "status": "completed"}' \
  http://localhost:3001/projects/12345678
```

##### `DELETE /projects/:id`
Eliminar proyecto
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/projects/12345678
```

#### **Gestión de Estados**

##### `PATCH /projects/:id/approve`
Aprobar proyecto (requiere rol Owner/Leader)
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/projects/12345678/approve
```

##### `PATCH /projects/:id/reject`
Rechazar proyecto (requiere rol Owner/Leader)
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "No cumple los requisitos"}' \
  http://localhost:3001/projects/12345678/reject
```

#### **Consultas Especializadas**

##### `GET /projects/stats`
Estadísticas de proyectos
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/projects/stats?ownerId=1"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 47,
    "pending_approval": 12,
    "approved": 28,
    "rejected": 5,
    "completed": 2
  }
}
```

##### `GET /projects/search`
Búsqueda avanzada
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/projects/search?q=nodejs&status=approved&location=madrid"
```

##### `GET /projects/org/:id_org`
Proyectos por organización
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/projects/org/1
```

### **📊 Códigos de Respuesta**

| Código | Descripción | Ejemplo |
|--------|-------------|---------|
| `200` | Éxito | Proyecto obtenido |
| `201` | Creado | Proyecto creado |
| `400` | Error validación | Campos requeridos faltantes |
| `401` | No autorizado | JWT token inválido |
| `403` | Prohibido | Permisos insuficientes |
| `404` | No encontrado | Proyecto no existe |
| `409` | Conflicto | Proyecto duplicado |
| `429` | Demasiadas requests | Rate limit excedido |
| `500` | Error servidor | Error interno |

## 🔐 Autenticación

### **JWT Token Structure**
```json
{
  "userId": 1,
  "username": "usuario",
  "rol": "Owner",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### **Roles de Usuario**
- **Owner**: Acceso completo, puede aprobar/rechazar proyectos
- **Leader**: Puede gestionar proyectos del equipo
- **User**: Puede crear y ver sus propios proyectos

### **Validación de Token**
El middleware valida automáticamente:
1. **Firma JWT** con secret configurado
2. **Expiración** del token
3. **Usuario activo** en base de datos
4. **Permisos** para la operación solicitada

### **Frontend Integration**
```javascript
// Configuración Axios
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

// Interceptor para manejo automático de tokens
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## 🗄️ Base de Datos

### **Esquema de Tabla Projects**
```sql
CREATE TABLE projects (
    id_project INTEGER PRIMARY KEY,              -- ID único de 8 dígitos
    name VARCHAR(255) NOT NULL,                  -- Nombre del proyecto
    description TEXT,                            -- Descripción detallada
    location VARCHAR(255),                       -- Ubicación
    status VARCHAR(50) DEFAULT 'pending_approval' 
        CHECK (status IN ('pending_approval', 'approved', 'rejected', 'completed')),
    created_by INTEGER NOT NULL,                 -- ID del creador
    modified_by INTEGER NOT NULL,                -- ID del último modificador
    owner_id INTEGER NOT NULL,                   -- ID del propietario
    id_org INTEGER,                             -- ID de organización (opcional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Índices de Optimización**
```sql
-- Búsquedas por estado
CREATE INDEX idx_projects_status ON projects(status);

-- Búsquedas por propietario
CREATE INDEX idx_projects_owner ON projects(owner_id);

-- Búsquedas por organización
CREATE INDEX idx_projects_org ON projects(id_org);

-- Ordenamiento por fecha (más recientes primero)
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Búsqueda de texto en nombre
CREATE INDEX idx_projects_name_gin ON projects USING gin(to_tsvector('spanish', name));
```

### **Generación de IDs Únicos**
Los IDs de proyecto se generan como enteros aleatorios de 8 dígitos:
- **Rango**: 10,000,000 - 99,999,999
- **Verificación**: Automática contra duplicados
- **Reintentos**: Hasta 10 intentos si hay colisión
- **Ventajas**: No secuencial, dificulta enumeración

```javascript
// Ejemplo de ID generado
const projectId = 47382951 // 8 dígitos aleatorios
```

### **Conexión y Pool**
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,                    // Máximo 10 conexiones
  idleTimeoutMillis: 30000,   // Timeout de inactividad
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
})
```

## 🛠️ Desarrollo

### **Iniciar en Desarrollo**
```bash
# Modo desarrollo con hot-reload
npm run dev

# Modo producción
npm start

# Con logs detallados
DEBUG=* npm run dev
```

### **Scripts Disponibles**
```bash
npm run dev         # Desarrollo con nodemon
npm start           # Producción
npm test            # Ejecutar tests
npm run test:watch  # Tests en modo watch
npm run lint        # Linter ESLint
npm run lint:fix    # Corrección automática
```

### **Estructura del Proyecto**
```
projects-service/
├── config/
│   └── database.js         # Configuración PostgreSQL
├── controllers/
│   └── projectController.js # Lógica de negocio
├── models/
│   └── Project.js          # Modelo de datos
├── routes/
│   └── projectsRoutes.js   # Definición de endpoints
├── middleware/             # (OBSOLETO - usar shared)
├── tests/
│   ├── unit/              # Tests unitarios
│   ├── integration/       # Tests de integración
│   └── fixtures/          # Datos de prueba
├── docs/
│   ├── api.md             # Documentación API
│   └── deployment.md      # Guía de deployment
├── server.js              # Servidor principal
├── package.json
├── .env                   # Variables de entorno
└── README.md
```

### **Testing**
```bash
# Ejecutar todos los tests
npm test

# Test específico
npm test -- --testNamePattern="Project creation"

# Coverage
npm test -- --coverage

# Tests de integración
npm run test:integration
```

### **Ejemplo de Test**
```javascript
describe('Project Creation', () => {
  test('should create project with unique ID', async () => {
    const projectData = {
      name: 'Test Project',
      description: 'Test description',
      created_by: 1
    }
    
    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${validToken}`)
      .send(projectData)
      .expect(201)
    
    expect(response.body.data.id_project).toMatch(/^\d{8}$/)
    expect(response.body.data.name).toBe('Test Project')
  })
})
```

## 🚀 Deployment

### **Docker Setup**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

USER node

CMD ["npm", "start"]
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  projects-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: projectsDatabase
      POSTGRES_USER: projectsGroup
      POSTGRES_PASSWORD: projects2025
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### **Producción**
```bash
# Build para producción
npm run build

# Iniciar con PM2
pm2 start server.js --name "projects-service"

# Nginx proxy
server {
    listen 80;
    server_name projects-api.tudominio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
    }
}
```

## 🔍 Troubleshooting

### **Errores Comunes**

#### **Error de Conexión a BD**
```
❌ Error: Could not connect to database
```
**Solución:**
- Verificar variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Comprobar conectividad de red
- Verificar credenciales de PostgreSQL

#### **Error JWT**
```
❌ JWT validation failed: TokenExpiredError
```
**Solución:**
- Regenerar token con `/test-token`
- Verificar `JWT_SECRET` en `.env`
- Comprobar sincronización de tiempo del servidor

#### **Error CORS**
```
❌ CORS policy: Cross origin requests are blocked
```
**Solución:**
- Añadir origen frontend a `CORS_ORIGIN` en `.env`
- Verificar configuración en middleware

#### **Rate Limit Excedido**
```
❌ Too many requests from this IP
```
**Solución:**
- Aumentar `RATE_LIMIT_MAX_REQUESTS` en desarrollo
- Implementar whitelist de IPs para desarrollo

### **Logs de Debug**
```bash
# Habilitar logs detallados
DEBUG=projects-service:* npm run dev

# Logs de base de datos
DEBUG=pg:* npm run dev

# Logs de middleware
DEBUG=middleware:* npm run dev
```

### **Health Check**
```bash
# Verificar estado del servicio
curl http://localhost:3001/health

# Verificar conexión a BD
curl http://localhost:3001/health | jq '.data.database'

# Verificar middleware
curl http://localhost:3001/health | jq '.data.security'
```

## 📚 Recursos Adicionales

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [Shared Middleware Documentation](../shared/middleware-package/README.md)
- [API Testing with Postman](./docs/postman-collection.json)

# Swarms API - IoT Swarm Management System

RESTful API for managing IoT device swarms with authentication, role-based access control, and comprehensive device management.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Development](#development)

## Features

### Core Functionality
- ✅ **Swarm Management** - Create, update, delete, and monitor IoT swarms
- ✅ **Device Assignment** - Assign/remove devices to/from swarms
- ✅ **State Management** - Request → Assign → Activate → Pause/Complete workflow
- ✅ **Statistics** - Real-time swarm and device analytics
- ✅ **Role-based Access Control** - Owner, Leader, User permissions

### Security & Infrastructure
- 🔐 **JWT Authentication** - Bearer token validation
- 🛡️ **Security Headers** - Automatic security middleware
- 🚦 **Rate Limiting** - Configurable request limits
- 🌐 **CORS Support** - Environment-based origin configuration
- 📊 **Request Logging** - Morgan + Winston integration
- ⚡ **Compression** - Automatic response compression

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend          │    │   Auth Service      │    │   Swarms Service    │
│   (React/Vue)       │    │   (Login/Register)  │    │   (This API)        │
└──────────┬──────────┘    └──────────┬──────────┘    └──────────┬──────────┘
           │                          │                          │
           │ 1. Login                 │                          │
           │ ────────────────────────▶│                         │
           │                          │                          │
           │ 2. JWT Token             │                          │
           │ ◀────────────────────────│                         │
           │                          │                          │
           │ 3. API Requests + Token  │                          │
           │ ──────────────────────────────────────────────────▶│
           │                          │                          │
           │                          │                    ┌─────┴─────┐
           │                          │                    │ Call      │
           │                          │                    │ Shared    │
           │                          │                    │ Middleware│
           │                          │                    └─────┬─────┘
           │                          │                          │
           │                          │                    ✅ Valid Token
           │                          │                          ▼
           │ 4. Swarm Data            │                  Process Request
           │ ◀──────────────────────────────────────────────────│
```

## Database Schema

### Swarms Table
```sql
CREATE TABLE swarms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_devices INTEGER NOT NULL CHECK (max_devices > 0 AND max_devices <= 1000),
    requester_id INTEGER NOT NULL,
    project_id INTEGER NULL,
    cluster_manager_id INTEGER NULL,
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'assigned', 'active', 'paused', 'completed', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP NULL,
    activated_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP NULL
);
```

### Swarm Devices Table
```sql
CREATE TABLE swarm_devices (
    swarm_id INTEGER REFERENCES swarms(id) ON DELETE CASCADE,
    device_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'sensor',
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by INTEGER NOT NULL,
    removed_at TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'active', 'inactive', 'removed')),
    PRIMARY KEY (swarm_id, device_id)
);
```

### Status Flow
```
Swarm Status: requested → assigned → active → paused/completed/rejected
Device Status: assigned → active → inactive → removed
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=SERVER_PORT
NODE_ENV=production
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swarms_db
DB_USERNAME=swarms_user
DB_PASSWORD=your_password

# Security Service
SECURITY_URL=http://localhost:8000

# JWT Configuration (Must match auth service)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://your-frontend.com
CORS_ORIGIN_DEV=http://localhost:3001,http://localhost:5174
```

### Environment Examples

Configure your `.env` file based on your environment needs. All sensitive data should be properly secured and never committed to version control.

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Shared middleware with dependencies installed (`npm ci` in shared middleware directory)

### Setup
```bash
# Clone repository
git clone https://github.com/IDGS10/mono-repo
cd backend/swarms

# Install dependencies
npm ci

# Database is already created and configured

# Configure environment
touch .env
# Edit .env with your configuration (see Environment Variables section)

# Start development server
npm run dev

# Start production server
npm start
```

## Authentication

### JWT Token Requirements
All protected endpoints require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Owner** | Full access to all swarms and operations |
| **Leader** | Can manage swarms, assign, activate, reject swarms |

### Getting a Token
Use the token obtained when logging into the system. This token will be automatically included in requests when using the frontend application.

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API documentation |
| GET | `/health` | Health check |

### Protected Endpoints (Require Authentication)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| **CRUD Operations** |
| POST | `/swarms` | Create new swarm | All |
| GET | `/swarms` | Get all swarms | All |
| GET | `/swarms/:id` | Get specific swarm | All |
| PUT | `/swarms/:id` | Update swarm | Owner, Creator |
| DELETE | `/swarms/:id` | Delete swarm | Owner, Creator |
| **State Management** |
| POST | `/swarms/:id/assign` | Assign to cluster manager | Owner, Leader |
| POST | `/swarms/:id/activate` | Activate swarm | Owner, Leader |
| POST | `/swarms/:id/pause` | Pause swarm | All |
| POST | `/swarms/:id/complete` | Complete swarm | All |
| POST | `/swarms/:id/reject` | Reject swarm | Owner, Leader |
| **Device Management** |
| GET | `/swarms/:id/devices` | Get swarm devices | All |
| POST | `/swarms/:id/devices` | Add device to swarm | All |
| DELETE | `/swarms/:id/devices/:deviceId` | Remove device | All |
| **Analytics** |
| GET | `/swarms/:id/stats` | Get swarm statistics | All |

## Usage Examples

### 1. Basic CRUD Operations

#### Create New Swarm
```bash
curl -X POST http://localhost:3000/swarms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Urban Sensor Network",
    "description": "Environmental monitoring downtown",
    "maxDevices": 50,
    "projectId": 123
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Swarm created successfully",
  "data": {
    "swarm": {
      "id": 1,
      "name": "Urban Sensor Network",
      "description": "Environmental monitoring downtown",
      "maxDevices": 50,
      "requesterId": 456,
      "projectId": 123,
      "status": "requested",
      "createdAt": "2025-08-07T15:30:00.000Z"
    }
  }
}
```

#### Get All Swarms (with filters)
```bash
# Get all swarms
curl -X GET http://localhost:3000/swarms \
  -H "Authorization: Bearer your-jwt-token"

# Filter by status
curl -X GET "http://localhost:3000/swarms?status=active" \
  -H "Authorization: Bearer your-jwt-token"

# Filter by requester
curl -X GET "http://localhost:3000/swarms?requesterId=456" \
  -H "Authorization: Bearer your-jwt-token"

# Filter by project
curl -X GET "http://localhost:3000/swarms?projectId=123" \
  -H "Authorization: Bearer your-jwt-token"

# Filter by cluster manager
curl -X GET "http://localhost:3000/swarms?clusterManagerId=789" \
  -H "Authorization: Bearer your-jwt-token"

# Multiple filters
curl -X GET "http://localhost:3000/swarms?status=active&projectId=123" \
  -H "Authorization: Bearer your-jwt-token"
```

**Available Query Parameters:**
- `status` - Filter by status: `requested`, `assigned`, `active`, `paused`, `completed`, `rejected`
- `requesterId` - Filter by requester user ID
- `clusterManagerId` - Filter by assigned cluster manager ID
- `projectId` - Filter by project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "swarms": [
      {
        "id": 1,
        "name": "Urban Sensor Network",
        "status": "active",
        "devices": [
          {
            "deviceId": 101,
            "role": "sensor",
            "status": "active"
          }
        ]
      }
    ],
    "count": 1,
    "userContext": {
      "userId": 456,
      "rol": "Leader"
    }
  }
}
```

#### Update Swarm
```bash
curl -X PUT http://localhost:3000/swarms/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Urban Sensor Network - Updated",
    "description": "Updated environmental monitoring",
    "maxDevices": 75
  }'
```

### 2. State Management Workflow

#### Assign Swarm to Cluster Manager
```bash
curl -X POST http://localhost:3000/swarms/1/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "clusterManagerId": 789
  }'
```

#### Activate Swarm
```bash
curl -X POST http://localhost:3000/swarms/1/activate \
  -H "Authorization: Bearer your-jwt-token"
```

#### Pause Swarm
```bash
curl -X POST http://localhost:3000/swarms/1/pause \
  -H "Authorization: Bearer your-jwt-token"
```

### 3. Device Management

#### Add Device to Swarm
```bash
curl -X POST http://localhost:3000/swarms/1/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "deviceId": 101,
    "role": "sensor"
  }'
```

**Available Device Roles:**
- `sensor` - Data collection device
- `actuator` - Control/action device  
- `gateway` - Communication hub
- `controller` - Processing unit

#### Get Swarm Devices
```bash
curl -X GET http://localhost:3000/swarms/1/devices \
  -H "Authorization: Bearer your-jwt-token"
```

#### Remove Device from Swarm
```bash
curl -X DELETE http://localhost:3000/swarms/1/devices/101 \
  -H "Authorization: Bearer your-jwt-token"
```

### 4. Analytics & Statistics

#### Get Swarm Statistics
```bash
curl -X GET http://localhost:3000/swarms/1/stats \
  -H "Authorization: Bearer your-jwt-token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swarm": {
      "id": 1,
      "name": "Urban Sensor Network",
      "status": "active",
      "maxDevices": 50
    },
    "stats": {
      "totalDevices": 15,
      "activeDevices": 12,
      "assignedDevices": 2,
      "inactiveDevices": 1,
      "removedDevices": 0,
      "devicesByRole": {
        "sensor": 10,
        "actuator": 3,
        "gateway": 2
      },
      "utilizationPercentage": 30
    }
  }
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "timestamp": "2025-08-07T15:30:00.000Z"
}
```

### Common Error Examples

#### Authentication Error
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "timestamp": "2025-08-07T15:30:00.000Z"
}
```

#### Validation Error
```json
{
  "success": false,
  "message": "Name, maxDevices and projectId are required",
  "timestamp": "2025-08-07T15:30:00.000Z"
}
```

#### Permission Error
```json
{
  "success": false,
  "message": "Insufficient permissions to assign swarms",
  "timestamp": "2025-08-07T15:30:00.000Z"
}
```

## Development

### Project Structure
```
backend/
├── swarms/                  # This service
│   ├── src/
│   │   ├── config/
│   │   │   ├── cors.js
│   │   │   ├── database.js
│   │   │   └── environment.js
│   │   ├── controllers/
│   │   │   └── swarmController.js
│   │   ├── middlewares/
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── index.js
│   │   │   ├── Swarm.js
│   │   │   └── SwarmDevice.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   └── swarmsRoutes.js
│   │   ├── services/
│   │   │   └── databaseService.js
│   │   ├── utils/
│   │   │   ├── banner.js
│   │   │   ├── logger.js
│   │   │   └── responses.js
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
├── shared/                  # Shared middleware (same level)
│   └── middleware-package/
└── security/               # Auth service (same level)
    └── ...
```

### Scripts
```bash
# Development
npm run dev          # Start with nodemon
npm start            # Start production server
npm test             # Run basic tests
```

### API Documentation
Visit http://localhost:3000/ for interactive API documentation.
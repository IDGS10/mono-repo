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
- ✅ **Swarm Management** - Create, update, delete, and monitor IoT device swarms
- ✅ **Device Management** - Direct device registration and assignment to swarms
- ✅ **State Management** - Request → Assign → Activate → Pause/Complete workflow
- ✅ **Real-time Monitoring** - Device online/offline status and battery tracking
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

### Device Swarms Table
```sql
CREATE TABLE device_swarms (
    swarm_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    swarm_name varchar(100),
    description text,
    max_devices integer,
    requester_id integer,
    project_id integer,
    cluster_manager_id integer,
    status varchar(20) DEFAULT 'requested',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_at timestamp without time zone,
    activated_at timestamp without time zone,
    completed_at timestamp without time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity timestamp without time zone,
    location varchar(200),
    is_active boolean DEFAULT true
);
```

### ESP32 Devices Table
```sql
CREATE TABLE esp32_devices (
    device_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    swarm_id uuid REFERENCES device_swarms(swarm_id),
    device_name varchar(100),
    mac_address varchar(17),
    firmware_version varchar(50),
    last_ip_address inet,
    device_type varchar(50) DEFAULT 'ESP32',
    location varchar(200),
    installation_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_seen timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_online boolean DEFAULT false,
    battery_level numeric(5,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

### Status Flow
```
Swarm Status: requested → assigned → active → paused/completed/rejected
Device Status: Directly managed (online/offline, assigned to swarm or not)
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
- PostgreSQL 12+ with UUID extension
- Shared middleware with dependencies installed (`npm ci` in shared middleware directory)

### Setup
```bash
# Clone repository
git clone https://github.com/IDGS10/mono-repo
cd backend/swarms

# Install dependencies
npm ci

# Enable UUID extension in PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
| POST | `/swarms/:id/devices` | Assign existing device to swarm | All |
| DELETE | `/swarms/:id/devices/:deviceId` | Remove device from swarm | All |
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
    "projectId": 123,
    "location": "Downtown Area"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Swarm created successfully",
  "data": {
    "swarm": {
      "swarmId": "550e8400-e29b-41d4-a716-446655440000",
      "swarmName": "Urban Sensor Network",
      "description": "Environmental monitoring downtown",
      "maxDevices": 50,
      "requesterId": 456,
      "projectId": 123,
      "location": "Downtown Area",
      "status": "requested",
      "isActive": true,
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

# Filter by location
curl -X GET "http://localhost:3000/swarms?location=downtown" \
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
- `location` - Filter by location (partial match)

**Response:**
```json
{
  "success": true,
  "data": {
    "swarms": [
      {
        "swarmId": "550e8400-e29b-41d4-a716-446655440000",
        "swarmName": "Urban Sensor Network",
        "status": "active",
        "location": "Downtown Area",
        "devices": [
          {
            "deviceId": "660e8400-e29b-41d4-a716-446655440001",
            "deviceName": "Temperature Sensor 01",
            "deviceType": "ESP32",
            "isOnline": true,
            "batteryLevel": 85.5
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
curl -X PUT http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Urban Sensor Network - Updated",
    "description": "Updated environmental monitoring",
    "maxDevices": 75,
    "location": "Extended Downtown Area"
  }'
```

### 2. State Management Workflow

#### Assign Swarm to Cluster Manager
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "clusterManagerId": 789
  }'
```

#### Activate Swarm
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/activate \
  -H "Authorization: Bearer your-jwt-token"
```

#### Pause Swarm
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/pause \
  -H "Authorization: Bearer your-jwt-token"
```

### 3. Device Management

#### Assign Existing Device to Swarm
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "deviceId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Device added to swarm successfully",
  "data": {
    "device": {
      "deviceId": "660e8400-e29b-41d4-a716-446655440001",
      "swarmId": "550e8400-e29b-41d4-a716-446655440000",
      "deviceName": "Temperature Sensor 01",
      "deviceType": "ESP32",
      "macAddress": "AA:BB:CC:DD:EE:FF",
      "isOnline": true,
      "batteryLevel": 85.5,
      "location": "Corner of Main St"
    }
  }
}
```

#### Get Swarm Devices
```bash
curl -X GET http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/devices \
  -H "Authorization: Bearer your-jwt-token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swarm": {
      "swarmId": "550e8400-e29b-41d4-a716-446655440000",
      "swarmName": "Urban Sensor Network",
      "status": "active"
    },
    "devices": [
      {
        "deviceId": "660e8400-e29b-41d4-a716-446655440001",
        "deviceName": "Temperature Sensor 01",
        "deviceType": "ESP32",
        "macAddress": "AA:BB:CC:DD:EE:FF",
        "firmwareVersion": "v1.2.3",
        "lastIpAddress": "192.168.1.100",
        "location": "Corner of Main St",
        "isOnline": true,
        "batteryLevel": 85.5,
        "lastSeen": "2025-08-07T15:25:00.000Z",
        "swarm": {
          "swarmId": "550e8400-e29b-41d4-a716-446655440000",
          "swarmName": "Urban Sensor Network"
        }
      }
    ],
    "count": 1
  }
}
```

#### Remove Device from Swarm
```bash
curl -X DELETE http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/devices/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer your-jwt-token"
```

### 4. Analytics & Statistics

#### Get Swarm Statistics
```bash
curl -X GET http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/stats \
  -H "Authorization: Bearer your-jwt-token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swarm": {
      "swarmId": "550e8400-e29b-41d4-a716-446655440000",
      "swarmName": "Urban Sensor Network",
      "status": "active",
      "maxDevices": 50
    },
    "stats": {
      "totalDevices": 15,
      "onlineDevices": 12,
      "offlineDevices": 3,
      "devicesByType": {
        "ESP32": 12,
        "Arduino": 3
      },
      "averageBatteryLevel": 73,
      "lowBatteryDevices": 2,
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

#### Device Already Assigned Error
```json
{
  "success": false,
  "message": "Device is already assigned to another swarm",
  "timestamp": "2025-08-07T15:30:00.000Z"
}
```

#### Swarm Capacity Error
```json
{
  "success": false,
  "message": "Swarm has reached its limit of 50 devices",
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
│   │   │   ├── Swarm.js        # Maps to device_swarms table
│   │   │   └── Device.js       # Maps to esp32_devices table
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

### Key Changes from Previous Version
- **UUID Primary Keys**: All entities now use UUID instead of integer IDs
- **Direct Device-Swarm Relationship**: Simplified many-to-many relationship removed
- **Enhanced Device Properties**: Added MAC address, IP address, battery level, online status
- **Location Support**: Both swarms and devices can have location information
- **Real-time Monitoring**: Device online/offline status and last seen timestamps

### Scripts
```bash
# Development
npm run dev          # Start with nodemon
npm start            # Start production server
npm test             # Run basic tests
```

### API Documentation
Visit http://localhost:3000/ for interactive API documentation.
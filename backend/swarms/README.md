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
- ✅ **MAC Address Requests** - Request specific existing devices by MAC address during swarm creation
- ✅ **Auto-Assignment** - Automatic assignment of available devices based on requested MACs
- ✅ **Device Availability Check** - Verify device existence and availability before assignment
- ✅ **State Management** - Request → Assign → Activate → Pause/Complete workflow
- ✅ **Real-time Monitoring** - Device online/offline status and battery tracking
- ✅ **Statistics** - Real-time swarm and device analytics
- ✅ **Role-based Access Control** - Organization, Cluster manager, Project manager permissions

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
    requested_macs jsonb,  -- NEW: Array of requested MAC addresses
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
    last_ip_address varchar(50),  -- Updated to varchar(50)
    device_type varchar(50) DEFAULT 'ESP32',
    location varchar(200),
    installation_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_seen timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_online boolean DEFAULT false,
    battery_level numeric(5,2),
    role varchar(50) DEFAULT 'sensor',  -- NEW: Device role
    assigned_at timestamp without time zone DEFAULT now(),  -- NEW
    assigned_by integer,  -- NEW: User who assigned the device
    removed_at timestamp without time zone,  -- NEW
    status varchar(20) DEFAULT 'assigned',  -- NEW: Device status
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

### Status Flow
```
Swarm Status: requested → assigned → active → paused/completed/rejected
Device Status: assigned → unassigned → maintenance → inactive
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

# Add the new column to existing database
ALTER TABLE device_swarms ADD COLUMN requested_macs JSONB;

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
| **Organization** | Full access to all swarms and operations |
| **Cluster manager** | Can manage assigned swarms, activate, pause, complete |
| **Project manager** | Can create swarms and manage own swarms |

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
| POST | `/swarms` | Create new swarm with optional MAC requests | All |
| GET | `/swarms` | Get all swarms | All |
| GET | `/swarms/:id` | Get specific swarm | All |
| PUT | `/swarms/:id` | Update swarm | Organization, Cluster manager, Creator |
| DELETE | `/swarms/:id` | Delete swarm | Organization, Cluster manager, Creator |
| **State Management** |
| POST | `/swarms/:id/assign` | Assign to cluster manager | Organization, Cluster manager |
| POST | `/swarms/:id/activate` | Activate swarm | Organization, Cluster manager |
| POST | `/swarms/:id/pause` | Pause swarm | All |
| POST | `/swarms/:id/complete` | Complete swarm | All |
| POST | `/swarms/:id/reject` | Reject swarm | Organization, Cluster manager |
| **Device Management** |
| GET | `/swarms/:id/devices` | Get swarm devices | All |
| POST | `/swarms/:id/devices` | Assign existing device to swarm | All |
| DELETE | `/swarms/:id/devices/:deviceId` | Remove device from swarm | All |
| POST | `/swarms/:id/assign-requested-devices` | Assign devices based on requested MACs | Organization, Cluster manager |
| **MAC Address Management** |
| GET | `/swarms/:id/requested-macs-status` | Get status of requested MACs | All |
| **Analytics** |
| GET | `/swarms/:id/stats` | Get swarm statistics | All |

## Usage Examples

### 1. Basic CRUD Operations

#### Create New Swarm (Simple - without MAC requests)
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

### Device Availability and MAC Requests

#### Important: MAC Address Requirements
The `requestedMacs` field should contain MAC addresses of devices that:
- **Already exist** in the `esp32_devices` table
- **Are available** (have `swarm_id = NULL`)
- **Are not assigned** to any other swarm

When you request MACs during swarm creation, the system will validate that these devices exist and are available for assignment.

#### Create New Swarm with Requested MACs (Simple format)
```bash
curl -X POST http://localhost:3000/swarms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Temperature Monitoring Swarm",
    "description": "Monitoring temperature in building A",
    "maxDevices": 10,
    "projectId": 123,
    "location": "Building A",
    "requestedMacs": [
      "AA:BB:CC:DD:EE:FF",
      "11:22:33:44:55:66",
      "77:88:99:AA:BB:CC"
    ]
  }'
```

**Note:** These MAC addresses must correspond to existing devices in your database that are currently unassigned.

#### Create New Swarm with Requested MACs (Extended format with metadata)
```bash
curl -X POST http://localhost:3000/swarms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Smart Building Sensors",
    "description": "Complete building monitoring system",
    "maxDevices": 15,
    "projectId": 456,
    "location": "Smart Building Tower",
    "requestedMacs": [
      {
        "mac": "AA:BB:CC:DD:EE:FF",
        "deviceName": "Temperature Sensor Office 1",
        "notes": "Northeast corner, near window"
      },
      {
        "mac": "11:22:33:44:55:66",
        "deviceName": "Humidity Sensor Hallway",
        "notes": "Central hallway, ceiling mounted"
      },
      {
        "mac": "77:88:99:AA:BB:CC",
        "deviceName": "Motion Detector Main Entrance",
        "notes": "Above main door, battery powered"
      }
    ]
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
      "swarmName": "Smart Building Sensors",
      "description": "Complete building monitoring system",
      "maxDevices": 15,
      "requesterId": 456,
      "projectId": 456,
      "location": "Smart Building Tower",
      "status": "requested",
      "requestedMacs": [
        {
          "mac": "AA:BB:CC:DD:EE:FF",
          "deviceName": "Temperature Sensor Office 1",
          "notes": "Northeast corner, near window",
          "requestedAt": "2025-08-18T15:30:00.000Z"
        },
        {
          "mac": "11:22:33:44:55:66",
          "deviceName": "Humidity Sensor Hallway",
          "notes": "Central hallway, ceiling mounted",
          "requestedAt": "2025-08-18T15:30:00.000Z"
        },
        {
          "mac": "77:88:99:AA:BB:CC",
          "deviceName": "Motion Detector Main Entrance",
          "notes": "Above main door, battery powered",
          "requestedAt": "2025-08-18T15:30:00.000Z"
        }
      ],
      "isActive": true,
      "createdAt": "2025-08-18T15:30:00.000Z"
    },
    "requestedMacsCount": 3
  }
}
```

#### Get All Swarms (with filters)
```bash
# Get all swarms
curl -X GET http://localhost:3000/swarms \
  -H "Authorization: Bearer your-jwt-token"

# Get swarms with requested MACs included
curl -X GET "http://localhost:3000/swarms?includeMacs=true" \
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
- `includeMacs` - Include requested MACs in response (`true`/`false`)

#### Update Swarm with MAC Requests
```bash
curl -X PUT http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Smart Building Sensors - Updated",
    "description": "Updated complete building monitoring system",
    "maxDevices": 20,
    "location": "Smart Building Tower - Floors 1-3",
    "requestedMacs": [
      "AA:BB:CC:DD:EE:FF",
      "11:22:33:44:55:66",
      "77:88:99:AA:BB:CC",
      "88:99:AA:BB:CC:DD"
    ]
  }'
```

### 2. State Management Workflow with Auto-Assignment

#### Assign Swarm to Cluster Manager (with auto-assignment)
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "clusterManagerId": 789,
    "autoAssignDevices": true
  }'
```

**Response with auto-assignment results:**
```json
{
  "success": true,
  "message": "Swarm assigned successfully",
  "data": {
    "swarm": {
      "swarmId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "assigned",
      "clusterManagerId": 789,
      "assignedAt": "2025-08-18T16:00:00.000Z"
    },
    "autoAssignmentResults": {
      "assigned": [
        {
          "mac": "AA:BB:CC:DD:EE:FF",
          "deviceId": "660e8400-e29b-41d4-a716-446655440001",
          "deviceName": "Temperature Sensor Office 1",
          "reason": "Successfully assigned"
        },
        {
          "mac": "11:22:33:44:55:66",
          "deviceId": "660e8400-e29b-41d4-a716-446655440002",
          "deviceName": "Humidity Sensor Hallway",
          "reason": "Successfully assigned"
        }
      ],
      "notFound": [
        {
          "mac": "77:88:99:AA:BB:CC",
          "reason": "Device not found in database"
        }
      ],
      "alreadyAssigned": [],
      "unavailable": []
    }
  }
}
```

#### Auto-Assignment Results Explanation:
- **`assigned`** - Devices that were successfully assigned to the swarm
- **`notFound`** - MAC addresses that don't exist in the database
- **`alreadyAssigned`** - Devices that are already assigned to other swarms
- **`unavailable`** - Devices that exist but are not available for assignment

### 3. MAC Address Management

#### Get Status of Requested MACs
```bash
curl -X GET http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/requested-macs-status \
  -H "Authorization: Bearer your-jwt-token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swarm": {
      "swarmId": "550e8400-e29b-41d4-a716-446655440000",
      "swarmName": "Smart Building Sensors",
      "status": "assigned"
    },
    "requestedMacs": [
      {
        "mac": "AA:BB:CC:DD:EE:FF",
        "deviceName": "Temperature Sensor Office 1",
        "notes": "Northeast corner, near window",
        "requestedAt": "2025-08-18T15:30:00.000Z",
        "status": "assigned_to_this_swarm",
        "deviceId": "660e8400-e29b-41d4-a716-446655440001",
        "currentSwarmId": "550e8400-e29b-41d4-a716-446655440000",
        "deviceStatus": "assigned",
        "isOnline": true,
        "batteryLevel": 85.5
      },
      {
        "mac": "11:22:33:44:55:66",
        "deviceName": "Humidity Sensor Hallway",
        "notes": "Central hallway, ceiling mounted",
        "requestedAt": "2025-08-18T15:30:00.000Z",
        "status": "available",
        "deviceId": "660e8400-e29b-41d4-a716-446655440003",
        "deviceName": "Humidity Sensor Device",
        "currentSwarmId": null,
        "deviceStatus": "unassigned",
        "isOnline": false,
        "batteryLevel": 67.2
      },
      {
        "mac": "77:88:99:AA:BB:CC",
        "deviceName": "Motion Detector Main Entrance",
        "notes": "Above main door, battery powered",
        "requestedAt": "2025-08-18T15:30:00.000Z",
        "status": "not_found",
        "deviceId": null,
        "deviceName": null,
        "currentSwarmId": null,
        "reason": "Device not found in database"
      },
      {
        "mac": "88:99:AA:BB:CC:DD",
        "deviceName": "Air Quality Sensor",
        "notes": "Conference room sensor",
        "requestedAt": "2025-08-18T15:30:00.000Z",
        "status": "assigned_elsewhere",
        "deviceId": "660e8400-e29b-41d4-a716-446655440004",
        "deviceName": "Air Quality Monitor",
        "currentSwarmId": "another-swarm-id",
        "reason": "Already assigned to another swarm"
      }
    ],
    "macsStatus": {
      "total": 4,
      "assigned": 1,
      "available": 1,
      "notFound": 1,
      "assignedElsewhere": 1
    }
  }
}
```

#### MAC Status Types:
- **`assigned_to_this_swarm`** - Device successfully assigned to this swarm
- **`available`** - Device exists and is available for assignment (swarm_id = NULL)
- **`not_found`** - MAC address doesn't exist in the database
- **`assigned_elsewhere`** - Device is already assigned to another swarm

#### Manual Device Assignment Based on Requested MACs
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/assign-requested-devices \
  -H "Authorization: Bearer your-jwt-token"
```

### 4. Device Management

#### Assign Device by MAC Address
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "macAddress": "11:22:33:44:55:66",
    "deviceRole": "sensor"
  }'
```

#### Assign Device by Device ID
```bash
curl -X POST http://localhost:3000/swarms/550e8400-e29b-41d4-a716-446655440000/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "deviceId": "660e8400-e29b-41d4-a716-446655440001",
    "deviceRole": "coordinator"
  }'
```

### 5. Enhanced Analytics & Statistics

#### Get Swarm Statistics with MAC Information
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
      "swarmName": "Smart Building Sensors",
      "status": "active",
      "maxDevices": 15
    },
    "stats": {
      "totalDevices": 8,
      "onlineDevices": 6,
      "offlineDevices": 2,
      "devicesByType": {
        "ESP32": 6,
        "Arduino": 2
      },
      "devicesByRole": {
        "sensor": 7,
        "coordinator": 1
      },
      "devicesByStatus": {
        "assigned": 8
      },
      "averageBatteryLevel": 73,
      "lowBatteryDevices": 1,
      "utilizationPercentage": 53,
      "recentlyAssigned": 2
    },
    "macsStats": {
      "totalRequested": 3,
      "assignedFromRequested": 2,
      "pendingAssignment": 0,
      "notFound": 1
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
  "timestamp": "2025-08-18T15:30:00.000Z"
}
```

### Common Error Examples

#### MAC Address Validation Error
```json
{
  "success": false,
  "message": "Invalid MAC address format: XX:YY:ZZ:AA:BB:CC",
  "timestamp": "2025-08-18T15:30:00.000Z"
}
```

#### Device Prerequisites for MAC Requests
Before requesting devices by MAC address, ensure:

1. **Devices exist** in the `esp32_devices` table
2. **Devices are available** (`swarm_id` is `NULL`)
3. **MAC addresses are valid** (format: `XX:XX:XX:XX:XX:XX`)
4. **Devices are not assigned** to other swarms

#### Example: Check Available Devices
```sql
-- Find available devices (ready for assignment)
SELECT device_id, device_name, mac_address, device_type, is_online, battery_level
FROM esp32_devices 
WHERE swarm_id IS NULL 
AND mac_address IS NOT NULL;
```

#### Duplicate MAC Addresses Error
```json
{
  "success": false,
  "message": "Duplicate MAC addresses in request",
  "timestamp": "2025-08-18T15:30:00.000Z"
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

### Key Features in This Version
- **UUID Primary Keys**: All entities use UUID instead of integer IDs
- **Requested MACs Support**: Project managers can request specific devices by MAC address
- **Auto-Assignment**: Automatic device assignment when swarms are assigned to cluster managers
- **Enhanced Device Properties**: MAC address, IP address, battery level, online status, role, assignment tracking
- **Real-time MAC Status**: Track the status of requested MAC addresses
- **Comprehensive Statistics**: Enhanced analytics including MAC assignment statistics

### Workflow Summary
1. **Project Manager** creates swarm with requested MACs of **existing available devices** → Status: `requested`
2. **Organization/Cluster Manager** assigns swarm → Status: `assigned` + **automatic assignment of available devices**
3. **System** searches for each MAC in `esp32_devices` table and assigns devices where `swarm_id = NULL`
4. **Cluster Manager** activates swarm → Status: `active`
5. **Anyone** can pause/complete swarm → Status: `paused`/`completed`

### MAC Address Workflow
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Project Manager   │    │   Existing Devices  │    │   Auto-Assignment   │
│   Requests MACs     │    │   in Database       │    │   Process           │
└──────────┬──────────┘    └──────────┬──────────┘    └──────────┬──────────┘
           │                          │                          │
           │ 1. Create swarm with     │                          │
           │    MAC addresses         │                          │
           │ ────────────────────────▶│                         │
           │                          │                          │
           │                          │ 2. Validate MACs exist  │
           │                          │    and are available    │
           │                          │ ────────────────────────▶│
           │                          │                          │
           │                          │                          │ 3. When assigned:
           │                          │                          │    Find devices by MAC
           │                          │                          │    Where swarm_id = NULL
           │                          │                          │    Assign to swarm
           │                          │ ◀────────────────────────│
           │                          │                          │
           │ 4. Assignment results    │                          │
           │ ◀────────────────────────────────────────────────────│
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
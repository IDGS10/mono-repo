# Swarm API Examples - All Routes

## 1. Basic CRUD

### POST /swarms - Create new swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Urban Sensor Swarm",
    "description": "Environmental data collection in downtown area",
    "maxDevices": 50,
    "requesterId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Swarm created successfully",
  "data": {
    "swarm": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Urban Sensor Swarm",
      "description": "Environmental data collection in downtown area",
      "maxDevices": 50,
      "requesterId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "requested",
      "createdAt": "2025-07-14T20:30:00.000Z"
    }
  }
}
```

### GET /swarms - Get all swarms
```bash
curl -X GET http://IP_SERVER:DESIGNED_PORT
/swarms

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "swarms": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Urban Sensor Swarm",
        "status": "active",
        "devices": [
          {
            "deviceId": "device-001",
            "role": "sensor",
            "status": "active"
          }
        ]
      }
    ],
    "count": 1
  }
}
```

### GET /swarms/:id - Get specific swarm
```bash
curl -X GET http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000
```

### PUT /swarms/:id - Update swarm
```bash
curl -X PUT http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Urban Sensor Swarm - Updated",
    "description": "Updated description",
    "maxDevices": 75
  }'
```

### DELETE /swarms/:id - Delete swarm
```bash
curl -X DELETE http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000
```

## 2. State Management

### POST /swarms/:id/assign - Assign to cluster manager
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/assign \
  -H "Content-Type: application/json" \
  -d '{
    "clusterManagerId": "cluster-mgr-001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Swarm assigned successfully",
  "data": {
    "swarm": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "assigned",
      "clusterManagerId": "cluster-mgr-001",
      "assignedAt": "2025-07-14T20:35:00.000Z"
    }
  }
}
```

### POST /swarms/:id/activate - Activate swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/activate
```

### POST /swarms/:id/pause - Pause swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/pause
```

### POST /swarms/:id/complete - Complete swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/complete
```

### POST /swarms/:id/reject - Reject swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/reject
```

## 3. Device Management

### GET /swarms/:id/devices - Get swarm devices
```bash
curl -X GET http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/devices
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "swarm": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Urban Sensor Swarm"
    },
    "devices": [
      {
        "deviceId": "device-001",
        "role": "sensor",
        "status": "active",
        "assignedAt": "2025-07-14T20:30:00.000Z"
      },
      {
        "deviceId": "device-002",
        "role": "actuator",
        "status": "active",
        "assignedAt": "2025-07-14T20:31:00.000Z"
      }
    ],
    "count": 2
  }
}
```

### POST /swarms/:id/devices - Add device to swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-003",
    "role": "sensor",
    "assignedBy": "cluster-mgr-001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Device added to swarm successfully",
  "data": {
    "swarmDevice": {
      "swarmId": "123e4567-e89b-12d3-a456-426614174000",
      "deviceId": "device-003",
      "role": "sensor",
      "assignedBy": "cluster-mgr-001",
      "status": "assigned",
      "assignedAt": "2025-07-14T20:40:00.000Z"
    }
  }
}
```

### DELETE /swarms/:id/devices/:deviceId - Remove device
```bash
curl -X DELETE http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/devices/device-003
```

## 4. Statistics

### GET /swarms/:id/stats - Get swarm statistics
```bash
curl -X GET http://IP_SERVER:DESIGNED_PORT
/swarms/123e4567-e89b-12d3-a456-426614174000/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "swarm": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Urban Sensor Swarm",
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

## Typical Usage Flow

### 1. Create a swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Swarm",
    "description": "Test swarm",
    "maxDevices": 10,
    "requesterId": "user-123"
  }'
```

### 2. Assign to cluster manager
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/SWARM_ID/assign \
  -H "Content-Type: application/json" \
  -d '{"clusterManagerId": "cluster-mgr-001"}'
```

### 3. Activate the swarm
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/SWARM_ID/activate
```

### 4. Add devices
```bash
curl -X POST http://IP_SERVER:DESIGNED_PORT
/swarms/SWARM_ID/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-001",
    "role": "sensor",
    "assignedBy": "cluster-mgr-001"
  }'
```

### 5. Monitor statistics
```bash
curl -X GET http://IP_SERVER:DESIGNED_PORT
/swarms/SWARM_ID/stats
```

## Common Error Codes

- **400**: Invalid data or missing required information
- **404**: Swarm or device not found
- **409**: Conflict (e.g., device already assigned)
- **500**: Internal server error

## Important Notes

- Replace `SWARM_ID` with the actual swarm ID
- All UUIDs must be valid
- The `requesterId` must exist in your system
- States follow a flow: `requested` → `assigned` → `active` → `paused`/`completed`
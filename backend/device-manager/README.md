##  Device Manager API
A RESTful API for managing IoT or networked devices — built with Node.js, Express, and PostgreSQL. It supports full CRUD operations for devices, organized by a clean architecture: controllers, services, and routing.

##  Features
 GET /devices – Fetch all devices

 GET /devices/:id – Fetch a single device

 POST /devices – Register a new device

 PUT /devices/:id – Update an existing device

 (DELETE not yet implemented — you rebel, feel free to add it)

##  API Endpoints
GET /api/devices
Returns all devices.

GET /api/devices/:id
Returns a specific device by ID.

POST /api/devices
Registers a new device. Requires full device payload.

PUT /api/devices/:id
Updates a device.

##  Powered by
Express.js – Web framework

PostgreSQL – Relational database

pg – Node.js PostgreSQL client

dotenv – Environment variable management

## How it Works

### Request Flow
Client → API Route

The request starts when a client sends an HTTP request to a route (e.g., GET /api/devices).

API Route → Controller

The routes/deviceRoutes.js maps the URL to a controller function.

#### Example:
 router.get('/devices', deviceController.getDevices);

### Controller → Service

The controller receives the request and delegates the logic to the appropriate service.

#### Example: 
const devices = await deviceService.getAllDevices();
res.json(devices);

### Service → (Model/DB/Logic)

Services contain business logic and, if used, DB access through models.

### Response → Client

The data is returned back to the controller, which formats the response (usually JSON), and sends it back to the client.


## Practical Example

###  Example Request

#### Paste in terminal:
curl http://localhost:5056/api/devices


#### Returns: 

[
  {
    "id": 1,
    "name": "Device 1",
    "description": "Mi primer dispositivo"
  }
]
7

## 👨‍💻 Author
Built by the Devices Team
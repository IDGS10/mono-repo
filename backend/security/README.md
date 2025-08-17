# 🔐 Authentication System - Backend

A complete backend for facial recognition authentication using **PostgreSQL in a vpc** as the database and integrated **Swagger/OpenAPI** documentation.

## 🚀 Features

- **Biometric Authentication**: Facial login using real embeddings
- **Cloud Database**: PostgreSQL on Neon
- **Security**: JWT tokens, bcrypt, rate limiting, helmet
- **RESTful API**: Full authentication endpoints
- **📚 Swagger Documentation**: Interactive API explorer
- **Logging & Auditing**: Full activity tracking
- **Scalability**: Production-ready architecture

## 🛠️ Tech Stack

- **Node.js** + **Express.js**
- **PostgreSQL** (Neon Cloud)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for HTTP security
- **Morgan** for logging
- **Rate Limiting** for DDoS protection
- **📖 Swagger UI** + **OpenAPI 3.0**

## 📚 API Documentation

### 🌐 Interactive Swagger UI

Access the full interactive documentation at:
```
http://localhost:8000/api/docs
```

**Key Features:**

- 🔧 Interactive testing of endpoints
- 📝 Detailed request/response schemas
- 🔐 JWT-based authentication
- 📊 Live request examples
- 🏷️ Organized by categories (tags)
- 💾 Authorization persistence between sessions

### 📋 Endpoint Categories

1. **🔍 System Status** – Health checks and uptime
2. **👤 Authentication** – Register, login, logout
3. **🎭 Facial Biometrics** – Enroll and facial login
4. **📊 User** – Profile and biometric data
5. **📈 Dashboard** – User stats and activity

## 📋 Available Endpoints

### 🔍 System Status
- `GET /api/health` — Server and DB status

### 👤 Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — Credential login
- `POST /api/auth/logout` — Logout

### 🎭 Facial Biometrics
- `POST /api/face/enroll` — Enroll face embeddings
- `POST /api/face/login` — Facial login

### 📊 User & Dashboard
- `GET /api/user/profile` — User profile
- `GET /api/dashboard/stats` — Dashboard stats
- `DELETE /api/user/biometric` — Delete biometric data

## 🗄️ Database

### PostgreSQL Configuration (Neon)
```env
DATABASE_URL=postgresql://neondb_owner:npg_XIqx1pQcmD3u@ep-muddy-shape-a56mayxk-pooler.us-east-2.aws.neon.tech/faceRecon?sslmode=require
```

### Auto-Created Tables

- `users` – User info
- `face_embeddings` – Facial embeddings
- `login_sessions` – Active login sessions
- `login_attempts` – Login audits
- `user_settings` – User preferences

## 🚀 Setup & Usage

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `config.env` file comes pre-configured with Neon DB settings.

### 3. Start the Server
```bash
# Development mode
npm run dev

# Production
npm start
```

### 4. Health Check
```bash
curl http://localhost:8000/api/health
```

### 5. 📚 Access Documentation
Open your browser and visit: http://localhost:8000/api/docs

## 🧪 Usage Examples

### 🔧 Using Swagger UI (Recommended)
1. Visit http://localhost:8000/api/docs
2. Select an endpoint
3. Click "Try it out"
4. Enter required parameters
5. Execute and view the result

### 📱 Using cURL

#### Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register   -H "Content-Type: application/json"   -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "password": "password123",
    "phone": "3001234567",
    "idNumber": "12345678"
  }'
```

#### Login with Credentials
```bash
curl -X POST http://localhost:8000/api/auth/login   -H "Content-Type: application/json"   -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

#### Enroll Facial Embeddings
```bash
curl -X POST http://localhost:8000/api/face/enroll   -H "Content-Type: application/json"   -H "Authorization: Bearer YOUR_JWT_TOKEN"   -d '{
    "embeddings": [
      {
        "data": [0.1, 0.2, 0.3],
        "type": "normal",
        "quality": 0.95
      }
    ]
  }'
```

#### Facial Login
```bash
curl -X POST http://localhost:8000/api/face/login   -H "Content-Type: application/json"   -d '{
    "embedding": [0.1, 0.2, 0.3]
  }'
```

## 🔒 Security

- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet**: HTTP security headers
- **CORS**: Configured for frontend
- **JWT**: Secure, expiring tokens
- **bcrypt**: Password hashing with 12 salt rounds
- **SSL**: Enforced with Neon DB

## 📊 Logging & Auditing

- All login attempts are recorded
- Full request/response logging
- Biometric actions tracked
- Graceful error handling

## 🌐 Environment Variables

```env
# Server
PORT=8000
NODE_ENV=production

# JWT
JWT_SECRET=facial_auth_secret_key_2024_neon_postgresql

# PostgreSQL Neon
DATABASE_URL=postgresql://...
DB_HOST=ep-muddy-shape-a56mayxk-pooler.us-east-2.aws.neon.tech
DB_PORT=5432
DB_NAME=faceRecon
DB_USER=neondb_owner
DB_PASSWORD=npg_XIqx1pQcmD3u
DB_SSL=require

# Config
MAX_FILE_SIZE=10mb
SESSION_TIMEOUT=24h
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Default Test User

A default user is auto-created:
- **Email**: `admin@faceauth.com`
- **Password**: `admin123`

## 📈 Server Health Example

Response from `/api/health`:
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-06-03T20:38:06.337Z",
  "database": "connected",
  "database_type": "PostgreSQL (Neon)",
  "stats": {
    "total_users": 1,
    "active_sessions": 0
  }
}
```

## 📚 Data Schemas

### User
```json
{
  "id": 1,
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "3001234567",
  "idNumber": "12345678",
  "createdAt": "2025-06-03T20:38:06.337Z",
  "biometricEnabled": true,
  "activeSessions": 1
}
```

### Facial Embedding
```json
{
  "data": [0.1, 0.2, 0.3, -0.1, 0.5],
  "type": "normal",
  "quality": 0.95
}
```

### Facial Login Response
```json
{
  "success": true,
  "message": "Facial login successful",
  "userToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com"
  },
  "similarity": "0.876"
}
```

## 🔧 Development

### Available Scripts

- `npm start` – Start production server  
- `npm run dev` – Development with nodemon  
- `npm test` – Run unit tests  
- `npm run migrate` – Run DB migrations  
- `npm run seed` – Seed demo data  
- `npm run backup` – Backup the DB  

### Project Structure

```
backend/
├── server.js          # Main server with Swagger docs
├── swagger.js         # Swagger/OpenAPI config
├── package.json       # Dependencies and scripts
├── config.env         # Environment variables
├── README.md          # This documentation
└── scripts/           # Utility scripts
```

## 🧪 API Testing Options

1. **Swagger UI**: http://localhost:8000/api/docs (Recommended)  
2. **Health Check**: http://localhost:8000/api/health  
3. **Postman**: Import from Swagger JSON  
4. **cURL**: Use examples above  

## 🚨 Troubleshooting

### PostgreSQL Connection Error
- Check if `DATABASE_URL` is correct  
- Ensure internet connectivity  
- Verify that the Neon instance is active  

### JWT Error
- Ensure `JWT_SECRET` is set  
- Check token expiration  

### Rate Limiting Error
- Wait 15 minutes to reset  
- Adjust limits via `.env`  

### Swagger UI Not Loading
- Ensure dependencies are installed  
- Confirm `swagger.js` exists  
- Check for console/server errors  

## 📖 Additional Info

### Important URLs
- **API Base**: http://localhost:8000/api  
- **📚 Swagger Docs**: http://localhost:8000/api/docs  
- **Health Check**: http://localhost:8000/api/health  

### JWT Auth in Swagger
1. Login via `/api/auth/login`  
2. Copy the token from the response  
3. In Swagger UI, click **Authorize**  
4. Paste as `Bearer YOUR_TOKEN`  
5. Test protected endpoints  

## 📞 Support

For technical support or bug reports:
- Review Swagger documentation  
- Check server logs  
- Contact the dev team

---

**Built with ❤️ for secure biometric authentication**  
**📚 Documented with Swagger/OpenAPI for maximum usability**
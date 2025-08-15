# 🐳 Backend Services - Docker Orchestration

This directory contains the Docker orchestration for all backend microservices in the mono-repo. Each team maintains their own service while sharing common infrastructure and middleware.

## 📁 Directory Structure

```
backend/
├── docker-compose.yml              # Main orchestration file
├── README.md                       # This file
├── shared/
│   └── middleware-package/         # Shared middleware for all services
├── security/                       # Security team service
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   └── ...
├── device-manager/                 # Device Manager team 
|   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   └── ...
├── organizations/                  # Organizations team service
├── projects/                       # Projects team service
├── swarms/                         # Swarms team service
└── analytics/                      # Analytics team service
```

## 🚀 Quick Start

### Prerequisites
- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

### Running Services

```bash
# Navigate to backend directory
cd /path/to/mono-repo/backend

# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d security

# View logs
docker-compose logs -f security

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## 🏗️ How to Add Your Service

### Step 1: Create Your Service Structure

Each team should have this minimum structure:

```
your-service/
├── Dockerfile                      # Your service Docker configuration
├── .dockerignore                   # Files to exclude from Docker build
├── .env                           # Your service environment variables
├── package.json                   # Your dependencies
├── server.js                      # Your main application file
└── ... (your service files)
```

### Step 2: Create Your Dockerfile

Use this template for your `Dockerfile`:

```dockerfile
# Use official Node.js LTS image as base
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ===== DEPENDENCIES STAGE =====
FROM base AS deps

WORKDIR /app

# Copy package files from your service folder
COPY your-service/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ===== BUILD STAGE =====
FROM base AS build

WORKDIR /app

# Copy package files from your service folder
COPY your-service/package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code from your service folder
COPY your-service/ .

# Remove unnecessary files for production
RUN rm -rf tests/ .git/ .gitignore README.md

# ===== PRODUCTION STAGE =====
FROM base AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8001  # Change this port for your service

# Copy dumb-init
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --from=build --chown=nodejs:nodejs /app ./

# Set proper permissions
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Expose port (change for your service)
EXPOSE 8001

# Health check (update the path for your service)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
```

### Step 3: Create Your .dockerignore

```dockerignore
# Node modules
node_modules/
npm-debug.log*

# Environment files (keep .env for Docker but exclude others)
.env.local
.env.development
.env.test
.env.production

# Git
.git/
.gitignore

# Documentation
README.md
*.md

# Test files
tests/
coverage/

# Development tools
.vscode/
.idea/

# Logs
logs/
*.log

# Temporary files
*.tmp
*.temp

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore
```

### Step 4: Create Your .env File

```env
# Database Configuration (if needed)
DATABASE_URL='your-database-url'
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PORT=5432

# Environment
NODE_ENV=development

# Service specific configuration
JWT_SECRET='your-jwt-secret'
API_KEY='your-api-key'

# Add your specific environment variables here
```

### Step 5: Add Your Service to docker-compose.yml

Add your service configuration to the main `docker-compose.yml`:

```yaml
  # Your Service Name
  your-service:
    build:
      context: .
      dockerfile: ./your-service/Dockerfile
      target: production
      args:
        - NODE_ENV=production
    container_name: your-service
    restart: unless-stopped
    ports:
      - "8001:8001"  # Change port number for your service
    environment:
      - NODE_ENV=production
      - PORT=8001    # Change port number for your service
    env_file:
      - ./your-service/.env
    volumes:
      - ./your-service/logs:/app/logs
      - ./shared:/shared:ro  # Mount shared middleware
    networks:
      - backend-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    depends_on:
      - security  # Add dependencies if needed
```

## 🔧 Using Shared Middleware

All services can use the shared middleware package located in `./shared/middleware-package/`.

### Add to your package.json:

```json
{
  "dependencies": {
    "@mono-repo/shared-middleware": "file:../shared/middleware-package",
    // ... other dependencies
  }
}
```

### Use in your code:

```javascript
const { createMiddleware } = require('@mono-repo/shared-middleware');

const middleware = createMiddleware({
  serviceName: 'your-service-name',
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: ['http://localhost:5173'],
  // ... other configuration
});

// Apply middleware to your Express app
app.use(middleware.cors);
app.use(middleware.security);
app.use(middleware.rateLimiting);
// ... etc
```

## 🌐 Port Allocation

To avoid conflicts, use these port ranges:

| Service | Port Range | Example |
|---------|------------|---------|
| Security | 8000-8099 | 8000 |
| Device Manager | 8100-8199 | 8100 |
| Organizations | 8200-8299 | 8200 |
| Projects | 8300-8399 | 8300 |
| Swarms | 8400-8499 | 8400 |
| Analytics | 8500-8599 | 8500 |
| Face Recognition | 8600-8699 | 8600 |
| Notifications | 8700-8799 | 8700 |

## 🏥 Health Checks

Every service MUST implement a health check endpoint:

```javascript
// Add this route to your service
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'your-service-name',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    // Add database status check if applicable
    database: 'connected' // or 'disconnected'
  });
});
```

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Non-root User**: Always run containers as non-root
3. **Resource Limits**: Set CPU and memory limits
4. **Health Checks**: Implement proper health endpoints
5. **SSL/TLS**: Use SSL certificates for production
6. **Shared Middleware**: Use common security middleware

## 📊 Monitoring and Logs

### View Logs

```bash
# View logs for specific service
docker-compose logs -f your-service

# View logs for all services
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100 your-service
```

### Service Status

```bash
# Check service status
docker-compose ps

# Check resource usage
docker stats

# Check health status
curl http://localhost:8001/api/health
```

## 🚀 Deployment

### Development

```bash
# Start in development mode
docker-compose up

# Rebuild after changes
docker-compose up --build
```

### Production

```bash
# Start in production mode (detached)
docker-compose up -d

# Scale services if needed
docker-compose up -d --scale your-service=3

# Update service
docker-compose up -d --no-deps your-service
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port Conflicts**: Check if ports are already in use
   ```bash
   netstat -tulpn | grep :8000
   ```

2. **Build Failures**: Check Dockerfile syntax and paths
   ```bash
   docker-compose build your-service
   ```

3. **Container Won't Start**: Check logs for errors
   ```bash
   docker-compose logs your-service
   ```

4. **Health Check Failing**: Verify health endpoint exists
   ```bash
   curl http://localhost:8001/api/health
   ```

### Useful Commands

```bash
# Remove all containers and volumes
docker-compose down -v

# Remove unused Docker resources
docker system prune -a

# Enter running container
docker exec -it your-service sh

# Check container resources
docker stats your-service
```

## 📞 Support

For questions or issues:

1. Check the logs first: `docker-compose logs your-service`
2. Verify your health endpoint works
3. Check this README for common solutions
4. Ask in the team chat for assistance

## 🔄 Updates

When updating your service:

1. Update your code
2. Test locally with `docker-compose up --build your-service`
3. Update version in your `package.json`
4. Commit changes
5. Deploy with `docker-compose up -d --no-deps your-service`

---

**Happy Dockerizing! 🐳**

# ========== BASE IMAGE ==========
FROM node:20-alpine AS base

WORKDIR /app

# Install dumb-init and curl for signal handling and healthcheck
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ========== DEPENDENCIES ==========
FROM base AS deps

WORKDIR /app
COPY organizations/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ========== DEVELOPMENT ==========
FROM base AS development

WORKDIR /app

# Copy shared middleware first
COPY shared/ /shared/

# Copy package files and install all dependencies
COPY organizations/package*.json ./
RUN npm install

# Copy source code
COPY organizations/ ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8200

CMD ["dumb-init", "npm", "run", "dev"]

# ========== PRODUCTION ==========
FROM base AS production

WORKDIR /app

# Copy shared middleware
COPY shared/ /shared/

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY organizations/ ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8200

CMD ["dumb-init", "node", "server.js"]

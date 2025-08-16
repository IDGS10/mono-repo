FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "ts-node", "mqtt/client.ts"]

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
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ========== BUILD ==========
FROM base AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Clean unnecessary files for production
RUN rm -rf tests/ postman/ .git/ .gitignore README.md .mocharc.json run-tests.sh

# ========== PRODUCTION ==========
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy dumb-init
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --from=build --chown=nodejs:nodejs /app ./ 

# Create logs folder
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app && chmod -R 755 /app

# Switch to non-root
USER nodejs

# Healthcheck 
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('./mqtt/client')" || exit 1

# Run with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["npx", "ts-node", "mqtt/client.ts"]

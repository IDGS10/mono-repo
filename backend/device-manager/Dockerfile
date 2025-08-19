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
RUN npm ci --omit=dev && npm cache clean --force

# ========== DEVELOPMENT ==========
FROM base AS development

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5057

CMD ["dumb-init", "npm", "run", "dev"]

# ========== PRODUCTION ==========
FROM base AS production

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5057

CMD ["dumb-init", "node", "server.js"]

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
ENV PORT=5057

# Copy dumb-init
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --from=build --chown=nodejs:nodejs /app ./

# Create dirs (logs, config)
RUN mkdir -p /app/config /app/logs && \
    chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root
USER nodejs

EXPOSE 5057

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5057/api/health || exit 1

# Run with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]


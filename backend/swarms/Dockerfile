# Use official Node.js LTS image as base
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user for swarms
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# ===== DEPENDENCIES STAGE =====
FROM base AS deps

WORKDIR /app

# Copy package files from swarms folder
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ===== BUILD STAGE =====
FROM base AS build

WORKDIR /app

# Copy package files from swarms folder
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code from swarms folder
COPY . .

# Remove unnecessary files for production
RUN rm -rf .git/ .gitignore README.md node_modules/

# ===== PRODUCTION STAGE =====
FROM base AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5052

# Copy dumb-init
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --from=build --chown=nodejs:nodejs /app ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5052

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5052/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]


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

# Copy package files from projects folder
COPY projects/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ===== BUILD STAGE =====
FROM base AS build

WORKDIR /app

# Copy package files from projects folder
COPY projects/package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code from projects folder
COPY projects/ .

# Copy shared middleware directory for build access
COPY shared/ /shared

# Remove unnecessary files for production
RUN rm -rf tests/ postman/ .git/ .gitignore README.md .mocharc.json run-tests.sh

# ===== PRODUCTION STAGE =====
FROM base AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5054  

# Copy dumb-init
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --from=build --chown=nodejs:nodejs /app ./

# Copy shared middleware directory for runtime access
COPY --from=build --chown=nodejs:nodejs /shared /shared

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs && \
    chmod 755 /app/logs

# Create SSL directory for PostgreSQL connections (if needed)
RUN mkdir -p /app/config/.ssl && \
    chown -R nodejs:nodejs /app/config/.ssl && \
    chmod 700 /app/config/.ssl

# Set proper permissions
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nodejs

EXPOSE 5054

# Health check 
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5054/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "app.js"]
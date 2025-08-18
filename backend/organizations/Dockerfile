# ===== BASE IMAGE =====
FROM node:18-alpine AS base

WORKDIR /app

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init curl

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ===== DEPENDENCIES STAGE =====
FROM base AS deps

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# ===== BUILD STAGE =====
FROM base AS build

WORKDIR /app

COPY package*.json ./

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# Copiar el código fuente
COPY . .

# Remover archivos innecesarios para producción
RUN rm -rf tests/ .git/ .gitignore README.md

# ===== PRODUCTION STAGE =====
FROM base AS production

WORKDIR /app

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8200

# Copiar dumb-init
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# Copiar dependencias de producción
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar el código
COPY --from=build --chown=nodejs:nodejs /app ./ 

# Permisos correctos
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto del servicio
EXPOSE 8200

# Usar dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar la app
CMD ["node", "server.js"]

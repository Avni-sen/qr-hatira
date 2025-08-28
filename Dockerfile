# Multi-stage Docker build
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package.json ./backend/

# Install dependencies
RUN npm ci --only=production

# Backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Build the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy source
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Build frontend
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm install typescript -g
RUN npm run build

# Production image, copy all the files and run the application
FROM base AS runner
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 angular

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Create upload directories
RUN mkdir -p ./backend/uploads ./public/uploads
RUN chown -R angular:nodejs ./backend/uploads ./public/uploads

# Copy public assets
COPY --from=builder /app/public ./public

USER angular

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start both applications
CMD ["sh", "-c", "node backend/dist/server.js & node dist/wedding-photo-share/server/server.mjs"]

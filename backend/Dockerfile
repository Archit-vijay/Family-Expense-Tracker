# ==========================================
# Stage 1: Build stage (compile TypeScript)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Deterministic install of all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# ==========================================
# Stage 2: Production runner stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Copy database migrations directory
COPY migrations/ ./migrations/

# Set ownership of all files to the unprivileged node user
RUN chown -R node:node /app

# Switch to unprivileged user for security
USER node

# Expose backend port
EXPOSE 5000

# Start production server
CMD ["node", "dist/server.js"]

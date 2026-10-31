# ==========================================
# Stage 1: Build stage (compile React & Vite)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Deterministic clean install of dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build argument to inject backend API URL during build if needed
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build optimized static files via Vite into /app/dist
RUN npm run build

# ==========================================
# Stage 2: Production runner stage (Nginx)
# ==========================================
FROM nginx:alpine AS runner

# Remove default Nginx landing page
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing fallback & gzip compression)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard web port
EXPOSE 80

# Run Nginx in foreground mode so Docker container stays active
CMD ["nginx", "-g", "daemon off;"]

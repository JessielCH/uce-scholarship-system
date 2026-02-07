# === Stage 1: Build React SPA ===
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --silent

# Build arguments (environment variables for Vite)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ARG VITE_CONTENTFUL_SPACE_ID
ARG VITE_CONTENTFUL_ACCESS_TOKEN
ARG VITE_CONTENTFUL_ENVIRONMENT
ARG VITE_APP_URL

# Build the React application
COPY . .
RUN npm run build

# === Stage 2: Serve with Nginx (Client-Only) ===
# This application is client-side only - no backend server
# All API calls go directly to Supabase
FROM nginx:stable-alpine

# Copy built React SPA to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx for SPA routing
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
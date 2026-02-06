FROM node:18-alpine AS builder
WORKDIR /app

# Allow passing VITE_ variables at build time (do NOT store secrets in repo)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ARG VITE_CONTENTFUL_SPACE_ID
ARG VITE_CONTENTFUL_ACCESS_TOKEN
ARG VITE_CONTENTFUL_ENVIRONMENT

# Install deps
COPY package*.json ./
RUN npm ci --silent

# Copy source
COPY . .

# Create .env used by Vite at build time (only contains VITE_ vars)
RUN printf 'VITE_SUPABASE_URL="%s"\nVITE_SUPABASE_ANON_KEY="%s"\nVITE_EMAILJS_SERVICE_ID="%s"\nVITE_EMAILJS_TEMPLATE_ID="%s"\nVITE_EMAILJS_PUBLIC_KEY="%s"\nVITE_CONTENTFUL_SPACE_ID="%s"\nVITE_CONTENTFUL_ACCESS_TOKEN="%s"\nVITE_CONTENTFUL_ENVIRONMENT="%s"\n' \
	"${VITE_SUPABASE_URL}" "${VITE_SUPABASE_ANON_KEY}" "${VITE_EMAILJS_SERVICE_ID}" "${VITE_EMAILJS_TEMPLATE_ID}" "${VITE_EMAILJS_PUBLIC_KEY}" "${VITE_CONTENTFUL_SPACE_ID}" "${VITE_CONTENTFUL_ACCESS_TOKEN}" "${VITE_CONTENTFUL_ENVIRONMENT}" \
	> .env

# Build app (Vite will read .env)
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

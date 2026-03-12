FROM node:20-alpine

# Create non-root user
RUN addgroup -S strapi && adduser -S strapi -G strapi

WORKDIR /app

# Install dependencies (deterministic)
COPY package*.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build Strapi
RUN npm run build

# Switch to non-root user
RUN chown -R strapi:strapi /app
USER strapi

# Cloud Run uses PORT env
ENV PORT=1337
EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/_health || exit 1

# Start Strapi
CMD ["npm", "run", "start"]

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production=false

# Copy source
COPY . .

# Build Strapi
RUN npm run build

# Cloud Run uses PORT env
ENV PORT=1337
EXPOSE 1337

# Start Strapi
CMD ["npm", "run", "start"]

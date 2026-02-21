# Railway Dockerfile for kitz-whatsapp-connector
# Build context must be the kitzV1 root (so kitz-schemas is accessible)
FROM node:20-alpine

RUN apk add --no-cache git

WORKDIR /app

# Copy shared schemas (needed for file: dependency)
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/
COPY kitz-schemas/tsconfig.json kitz-schemas/

# Copy connector
COPY kitz-whatsapp-connector/package.json kitz-whatsapp-connector/
COPY kitz-whatsapp-connector/tsconfig.json kitz-whatsapp-connector/

# Install dependencies
RUN cd kitz-whatsapp-connector && npm install

# Copy source
COPY kitz-whatsapp-connector/src/ kitz-whatsapp-connector/src/

# Auth directory for session persistence
RUN mkdir -p kitz-whatsapp-connector/auth_info_baileys

WORKDIR /app/kitz-whatsapp-connector

EXPOSE 3006

CMD ["npx", "tsx", "src/index.ts"]

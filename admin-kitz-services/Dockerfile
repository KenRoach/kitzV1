# Railway Dockerfile for admin-kitz-services
# Build context: kitzV1 root (so kitz-schemas is accessible)
FROM node:20-alpine

WORKDIR /app

# Shared schemas
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

# Service
COPY admin-kitz-services/package.json admin-kitz-services/
RUN cd admin-kitz-services && npm install

COPY admin-kitz-services/src/ admin-kitz-services/src/

WORKDIR /app/admin-kitz-services

EXPOSE 3011

CMD ["npx", "tsx", "src/index.ts"]

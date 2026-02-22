# Railway Dockerfile for kitz-gateway
# Build context: kitzV1 root (so kitz-schemas is accessible)
FROM node:20-alpine

WORKDIR /app

# Shared schemas
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

# Service
COPY kitz-gateway/package.json kitz-gateway/
RUN cd kitz-gateway && npm install

COPY kitz-gateway/src/ kitz-gateway/src/

WORKDIR /app/kitz-gateway

EXPOSE 4000

CMD ["npx", "tsx", "src/index.ts"]

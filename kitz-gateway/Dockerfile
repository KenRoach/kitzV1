# Railway Dockerfile for kitz-gateway
# Build context: kitzV1 root (so kitz-schemas is accessible)
FROM node:20-alpine

WORKDIR /app

# Shared schemas (local file dependency)
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/tsconfig.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

# Gateway package + install
COPY kitz-gateway/package.json kitz-gateway/
COPY kitz-gateway/tsconfig.json kitz-gateway/
RUN cd kitz-gateway && npm install --omit=dev && npm install tsx

# Gateway source
COPY kitz-gateway/src/ kitz-gateway/src/

# Create data dir for NDJSON fallback (ephemeral on Railway)
RUN mkdir -p /app/kitz-gateway/data

WORKDIR /app/kitz-gateway

ENV NODE_ENV=production

EXPOSE 4000

# Use tsx for runtime (kitz-schemas exports raw .ts)
CMD ["npx", "tsx", "src/index.ts"]

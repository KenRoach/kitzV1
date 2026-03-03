# Railway Dockerfile for kitz-social-connector
# Build context: kitzV1 root (so kitz-schemas is accessible)
FROM node:20-alpine

WORKDIR /app

# Shared schemas (local dependency)
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

# Service
COPY kitz-social-connector/package.json kitz-social-connector/
RUN cd kitz-social-connector && npm install

COPY kitz-social-connector/src/ kitz-social-connector/src/
COPY kitz-social-connector/tsconfig.json kitz-social-connector/

WORKDIR /app/kitz-social-connector

EXPOSE 3016

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3016/health || exit 1

CMD ["npx", "tsx", "src/index.ts"]

# Railway Dockerfile for kitz_os
# Build context: kitzV1 root (so kitz-schemas is accessible)
FROM node:20-alpine

WORKDIR /app

# Shared schemas
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

# Service
COPY kitz_os/package.json kitz_os/
RUN cd kitz_os && npm install

COPY kitz_os/src/ kitz_os/src/
COPY kitz_os/config/ kitz_os/config/

# Data directory for battery ledger
RUN mkdir -p kitz_os/data

WORKDIR /app/kitz_os

EXPOSE 3012

CMD ["npx", "tsx", "src/index.ts"]

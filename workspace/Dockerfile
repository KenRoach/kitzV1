# Railway Dockerfile for workspace
# Build context: kitzV1 root (so kitz-schemas is accessible)
FROM node:20-alpine

WORKDIR /app

# Shared schemas
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

# Service
COPY workspace/package.json workspace/
RUN cd workspace && npm install

COPY workspace/src/ workspace/src/

WORKDIR /app/workspace

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]

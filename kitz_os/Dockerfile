# Railway Dockerfile for kitz_os
# Build context: kitzV1 root (so kitz-schemas and ui are accessible)
FROM node:20-alpine AS base

# ── Stage 1: Build the KITZ Command Center SPA ──
FROM base AS spa-builder
WORKDIR /spa
COPY ui/package.json ./
RUN npm install
COPY ui/src/ src/
COPY ui/public/ public/
COPY ui/index.html ui/vite.config.ts ui/tsconfig.json ui/vite-env.d.ts ./
# Build with empty API base URL (same-origin — SPA served from kitz_os)
ENV VITE_API_BASE_URL=""
RUN npm run build

# ── Stage 2: Build kitz_os with bundled SPA ──
FROM base
WORKDIR /app

# Shared schemas
COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

# AOS (imported dynamically by swarm runner)
COPY aos/package.json aos/
COPY aos/src/ aos/src/

# Knowledge base (SOPs)
COPY kitz-knowledge-base/ kitz-knowledge-base/

# Service
COPY kitz_os/package.json kitz_os/
RUN cd kitz_os && npm install

COPY kitz_os/src/ kitz_os/src/
COPY kitz_os/config/ kitz_os/config/

# Data directory for battery ledger
RUN mkdir -p kitz_os/data

# Copy SPA build from stage 1 → kitz_os/public
COPY --from=spa-builder /spa/dist/ kitz_os/public/

WORKDIR /app/kitz_os

EXPOSE 3012

CMD ["npx", "tsx", "src/index.ts"]

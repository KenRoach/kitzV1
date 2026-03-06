# WhatsApp Connector Dockerfile
# Lives inside kitz-email-connector/ because this Railway service slot
# was repurposed. Railway scopes build context to Root Directory, so we
# clone the full repo to access kitz-schemas and kitz-whatsapp-connector.
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends git wget && rm -rf /var/lib/apt/lists/* \
    && printf '[url "https://github.com/"]\n\tinsteadOf = ssh://git@github.com/\n[url "https://github.com/"]\n\tinsteadOf = git@github.com:\n' > /root/.gitconfig

WORKDIR /app

# Clone the repo to get kitz-schemas + kitz-whatsapp-connector source
RUN git clone --depth 1 --branch main https://github.com/KenRoach/kitzV1.git /tmp/repo \
    && cp -r /tmp/repo/kitz-schemas ./kitz-schemas \
    && cp -r /tmp/repo/kitz-whatsapp-connector ./kitz-whatsapp-connector \
    && rm -rf /tmp/repo

# Install dependencies
RUN cd kitz-whatsapp-connector && npm install

# Auth directory for session persistence
RUN mkdir -p kitz-whatsapp-connector/auth_info_baileys

WORKDIR /app/kitz-whatsapp-connector

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3006/health || exit 1

CMD ["npx", "tsx", "src/index.ts"]

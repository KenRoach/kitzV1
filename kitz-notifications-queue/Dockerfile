# Railway Dockerfile for kitz-notifications-queue
FROM node:20-alpine

WORKDIR /app

COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

COPY kitz-notifications-queue/package.json kitz-notifications-queue/
RUN cd kitz-notifications-queue && npm install

COPY kitz-notifications-queue/src/ kitz-notifications-queue/src/

WORKDIR /app/kitz-notifications-queue

EXPOSE 3008

CMD ["npx", "tsx", "src/index.ts"]

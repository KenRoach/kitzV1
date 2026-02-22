# Railway Dockerfile for kitz-payments
FROM node:20-alpine

WORKDIR /app

COPY kitz-schemas/package.json kitz-schemas/
COPY kitz-schemas/src/ kitz-schemas/src/

COPY kitz-payments/package.json kitz-payments/
RUN cd kitz-payments && npm install

COPY kitz-payments/src/ kitz-payments/src/

WORKDIR /app/kitz-payments

EXPOSE 3005

CMD ["npx", "tsx", "src/index.ts"]

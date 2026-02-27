FROM node:20-alpine

WORKDIR /app

# Copy shared schemas (local dependency)
COPY kitz-schemas/package.json /app/kitz-schemas/
COPY kitz-schemas/src/ /app/kitz-schemas/src/

# Copy email connector
COPY kitz-email-connector/package.json .
RUN npm install --production

COPY kitz-email-connector/ .

EXPOSE 3007

CMD ["npx", "tsx", "src/index.ts"]

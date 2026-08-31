FROM node:22-alpine AS builder

WORKDIR /app/reelmind-app
COPY reelmind-app/package*.json ./
RUN npm ci
COPY reelmind-app/ ./
RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY reelmind-proxy/package*.json ./
RUN npm ci --production

COPY reelmind-proxy/ ./
COPY --from=builder /app/reelmind-app/dist/ ./public/

RUN addgroup -g 1001 -S nodejs && \
    adduser -S express -u 1001 -G nodejs

RUN mkdir -p /app/downloads && \
    chown -R express:nodejs /app

USER express

EXPOSE 3000

ENV PORT=3000
ENV DOWNLOAD_DIR=/app/downloads
ENV MAX_DOWNLOAD_BYTES=134217728

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "index.js"]

FROM node:22-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

FROM node:22-alpine
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_URL=file:/data/helpdesk.db
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json docker-entrypoint.sh ./
COPY prisma ./prisma
COPY src ./src
RUN mkdir /data && chown -R node:node /data /app
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["node", "src/server.js"]

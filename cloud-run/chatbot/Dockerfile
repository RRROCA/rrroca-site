FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM node:20-slim
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY data/ ./data/
COPY package.json ./
ENV PORT=8080
ENV NODE_ENV=production
USER appuser
EXPOSE 8080
CMD ["node", "src/server.js"]

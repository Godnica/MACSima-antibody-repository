# ── Stage 1: Build Angular frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npx ng build --configuration production

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source, migrations and init CSV files
COPY server/ ./server/
COPY migrations/ ./migrations/
COPY init-csv/ ./init-csv/

# Copy Angular build from stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

EXPOSE 3000

CMD ["node", "server/index.js"]

# ---- Etapa de Build ----
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json pnpm-lock.yaml* tsconfig*.json ./
COPY libs ./libs
COPY apps ./apps

RUN npm install
RUN npm install -g pnpm

# Compilar librerías y cada microservicio del monorepo
RUN npm run build:libs
RUN pnpm --filter "@poc/activation-api" build || true
RUN pnpm --filter "@poc/billing-service" build || true
RUN pnpm --filter "@poc/provisioning-service" build || true
RUN pnpm --filter "@poc/notification-service" build || true
RUN pnpm --filter "@poc/crm-analytics-service" build || true

# Consolidar los dist individuales en una carpeta dist general si fuera necesario
RUN mkdir -p /usr/src/app/dist/apps \
    && [ -d "apps/activation-api/dist" ] && cp -r apps/activation-api/dist dist/apps/activation-api || true \
    && [ -d "apps/billing-service/dist" ] && cp -r apps/billing-service/dist dist/apps/billing-service || true \
    && [ -d "apps/provisioning-service/dist" ] && cp -r apps/provisioning-service/dist dist/apps/provisioning-service || true \
    && [ -d "apps/notification-service/dist" ] && cp -r apps/notification-service/dist dist/apps/notification-service || true \
    && [ -d "apps/crm-analytics-service/dist" ] && cp -r apps/crm-analytics-service/dist dist/apps/crm-analytics-service || true

# ---- Etapa de Producción ----
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev
RUN npm install -g pnpm

# Copiar los artefactos compilados consolidados
COPY --from=builder /usr/src/app/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/apps/activation-api/main.js"]
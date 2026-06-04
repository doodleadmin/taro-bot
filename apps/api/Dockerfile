FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY tsconfig.json ./
RUN pnpm --filter @taro/shared run build
RUN pnpm --filter api run build

FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/index.js"]

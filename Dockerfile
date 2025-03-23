FROM node:22 AS base
WORKDIR /app
RUN corepack enable
ARG NPM_PROXY=https://verdaccio.tek4.vn
ENV NPM_PROXY=$NPM_PROXY
RUN npm config set registry $NPM_PROXY
RUN npm install -g corepack@latest

# Development dependencies
FROM base AS deps

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Production dependencies
FROM deps AS deps_prod
RUN pnpm prune --prod

# Build the application
FROM deps AS build

COPY src ./src
COPY tsconfig.json vite.config.ts ./
RUN pnpm build

# Final image
FROM base

COPY --from=deps_prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY drizzle ./drizzle

ENV NODE_ENV=production
CMD ["node", "dist/main.js", "--enable-source-maps"]

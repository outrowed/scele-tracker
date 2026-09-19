FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY core/package.json core/package.json
COPY ui/package.json ui/package.json
RUN pnpm install --frozen-lockfile
COPY core core
COPY ui ui
RUN pnpm build

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/core/node_modules ./core/node_modules
COPY --from=build --chown=node:node /app/core/dist ./core/dist
COPY --from=build --chown=node:node /app/core/package.json ./core/package.json
COPY --from=build --chown=node:node /app/ui/dist ./ui/dist
USER node
EXPOSE 3001
CMD ["node", "core/dist/index.js"]

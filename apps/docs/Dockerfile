FROM node:24.22.1-trixie-slim AS base
RUN npm install -g bun@1.3.14
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS manifests
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY apps/docs/package.json apps/docs/
COPY packages/api-types/package.json packages/api-types/
COPY packages/sdk-js/package.json packages/sdk-js/

FROM manifests AS deps
RUN bun install --frozen-lockfile

FROM manifests AS prod-deps
RUN bun install --frozen-lockfile --production

FROM base AS build
ARG NEXT_PUBLIC_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ -z "$NEXT_PUBLIC_BASE_URL" ]; then unset NEXT_PUBLIC_BASE_URL; fi; \
    node_modules/.bin/turbo run build --filter=@omniplex/docs

FROM node:24.22.1-trixie-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/docs/.next ./apps/docs/.next
COPY --from=build --chown=node:node /app/apps/docs/package.json /app/apps/docs/next.config.mjs /app/apps/docs/source.config.ts /app/apps/docs/openapi.json ./apps/docs/
WORKDIR /app/apps/docs
USER node
EXPOSE 3001
CMD ["/app/node_modules/.bin/next", "start"]

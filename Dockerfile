FROM node:24.22.1-trixie-slim AS base
RUN npm install -g bun@1.3.14
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS manifests
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY packages/api-types/package.json packages/api-types/

FROM manifests AS deps
RUN bun install --frozen-lockfile

FROM manifests AS prod-deps
RUN bun install --frozen-lockfile --production

FROM base AS build
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CDN_URL
ARG NEXT_PUBLIC_ARCADIA_URL
ARG NEXT_PUBLIC_ARCADIA_PANEL_SCOPE
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN for v in NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_API_URL NEXT_PUBLIC_CDN_URL NEXT_PUBLIC_ARCADIA_URL NEXT_PUBLIC_ARCADIA_PANEL_SCOPE NEXT_PUBLIC_TURNSTILE_SITE_KEY; do \
      if [ -z "$(printenv "$v")" ]; then unset "$v"; fi; \
    done; \
    node_modules/.bin/turbo run build --filter=@omniplex/web

FROM node:24.22.1-trixie-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/web/.next ./apps/web/.next
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /app/apps/web/src/content ./apps/web/src/content
COPY --from=build --chown=node:node /app/apps/web/package.json /app/apps/web/next.config.ts ./apps/web/
WORKDIR /app/apps/web
USER node
EXPOSE 3000
CMD ["/app/node_modules/.bin/next", "start"]

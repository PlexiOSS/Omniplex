FROM node:24.22.1-trixie-slim AS base
RUN npm install -g bun@1.3.14
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS manifests
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY apps/docs/package.json apps/docs/
COPY apps/staff/package.json apps/staff/
COPY packages/api-types/package.json packages/api-types/
COPY packages/core/package.json packages/core/
COPY packages/sdk-js/package.json packages/sdk-js/
COPY packages/ui/package.json packages/ui/

FROM manifests AS deps
RUN bun install --frozen-lockfile

FROM manifests AS prod-deps
RUN bun install --frozen-lockfile --production

FROM base AS build
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CDN_URL
ARG NEXT_PUBLIC_ARCADIA_URL
ARG NEXT_PUBLIC_ARCADIA_PANEL_SCOPE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN for v in NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_API_URL NEXT_PUBLIC_CDN_URL NEXT_PUBLIC_ARCADIA_URL NEXT_PUBLIC_ARCADIA_PANEL_SCOPE; do \
      if [ -z "$(printenv "$v")" ]; then unset "$v"; fi; \
    done; \
    node_modules/.bin/turbo run build --filter=@omniplex/staff

FROM node:24.22.1-trixie-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3002 \
    HOSTNAME=0.0.0.0
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/staff/.next ./apps/staff/.next
COPY --from=build --chown=node:node /app/apps/staff/public ./apps/staff/public
COPY --from=build --chown=node:node /app/apps/staff/package.json /app/apps/staff/next.config.ts ./apps/staff/
WORKDIR /app/apps/staff
USER node
EXPOSE 3002
CMD ["/app/node_modules/.bin/next", "start"]

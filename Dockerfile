FROM node:24.22.1-trixie-slim AS base
RUN npm install -g bun@1.3.14
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS build
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CDN_URL
ARG NEXT_PUBLIC_ARCADIA_URL
ARG NEXT_PUBLIC_ARCADIA_PANEL_SCOPE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN for v in NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_API_URL NEXT_PUBLIC_CDN_URL NEXT_PUBLIC_ARCADIA_URL NEXT_PUBLIC_ARCADIA_PANEL_SCOPE; do \
      if [ -z "$(printenv "$v")" ]; then unset "$v"; fi; \
    done; \
    bun run build

FROM node:24.22.1-trixie-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/src/content ./src/content
COPY --from=build --chown=node:node /app/package.json /app/next.config.ts ./
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]

FROM node:26.11.1-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS build
ARG SITE_URL
ARG SITE_INDEXABLE=false
ENV SITE_URL=$SITE_URL SITE_INDEXABLE=$SITE_INDEXABLE
COPY . .
RUN npm run legal:check && npm run build

FROM node:26.11.1-bookworm-slim AS runtime
WORKDIR /app
ARG COMMIT_SHA=development
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 PORT=8080 APP_COMMIT_SHA=$COMMIT_SHA
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8080
CMD ["node", "server.js"]

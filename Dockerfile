FROM node:22-alpine AS builder
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
USER root
RUN addgroup -g 10001 -S appgroup && adduser -u 10001 -S -G appgroup -D -H appuser
COPY --chown=10001:10001 nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=10001:10001 /app/dist /usr/share/nginx/html

USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["nginx", "-g", "daemon off;"]

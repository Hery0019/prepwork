# DOCK-001 : image multi-étapes construite depuis les sources, jamais depuis un bundle local.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# DOCK-002 : nginx sert les fichiers statiques avec un utilisateur non root.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# DOCK-003 : la configuration d'exécution est injectée au démarrage, pas figée au build.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 8080

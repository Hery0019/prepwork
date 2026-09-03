# DOCK-001 : image multi-étapes construite depuis les sources, jamais depuis un build local.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# La sortie autonome embarque le serveur et ses seules dépendances utiles.
RUN pnpm build

# DOCK-002 : le serveur tourne avec un utilisateur non root et n'expose qu'un port.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 8080
# DOCK-003 : la configuration d'exécution est lue dans l'environnement au démarrage.
CMD ["node", "server.js"]

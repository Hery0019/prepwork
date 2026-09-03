#!/bin/sh
# DOCK-003 : la configuration d'exécution est écrite au démarrage du conteneur, dans un
# petit fichier chargé avant le bundle. La même image sert tous les environnements.
set -eu

cat > /usr/share/nginx/html/runtime-config.js <<CONFIG
window.__RUNTIME_CONFIG__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-/api/v1}",
  VITE_AUTH_LOGIN_PATH: "\${VITE_AUTH_LOGIN_PATH:-/bff/login}",
};
CONFIG

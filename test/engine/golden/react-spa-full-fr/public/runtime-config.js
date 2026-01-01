// Configuration d'exécution servie à côté du bundle (DOCK-003). En développement elle porte
// les valeurs locales ; dans l'image, l'entrypoint la réécrit au démarrage du conteneur.
window.__RUNTIME_CONFIG__ = {
  VITE_API_BASE_URL: 'http://localhost:8080/api/v1',
  VITE_AUTH_LOGIN_PATH: '/bff/login',
};

// Remplaçant de `server-only` dans les tests. Le vrai module lève dès qu'il est chargé hors
// d'un contexte serveur, ce qui rendrait tout test d'un module serveur impossible ; ici il ne
// fait rien. La garantie reste entière dans le build, qui utilise le vrai.
export {};

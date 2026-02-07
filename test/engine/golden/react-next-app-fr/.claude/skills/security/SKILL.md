---
name: "security"
description: "Secrets, contenu injecté, en-têtes et authentification. À lire avant de toucher à la configuration ou à l'authentification."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Sécurité

Tout ce qui part dans le bundle est public : la sécurité du front consiste à ne jamais y mettre ce qui doit rester secret.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-070** · `gitleaks` — Tout ce qui part dans le bundle est public ; aucun secret, clé ou jeton privé n'est jamais lu par le code du navigateur.
  Pourquoi : Une variable `VITE_` est inlinée à la construction et lisible par quiconque ouvre les sources.
- **CORE-071** · `gitleaks` — `.env.example` est commité avec toutes les variables attendues ; `.env` est ignoré et jamais commité.
  Pourquoi : Un nouvel arrivant doit pouvoir démarrer le projet sans demander quelles variables existent.
- **CORE-072** · `eslint` — `dangerouslySetInnerHTML` n'est utilisé que sur du contenu assaini par le module dédié de `shared/`.
  Pourquoi : Tout autre usage transforme une chaîne stockée en exécution de script.
- **CORE-073** · `eslint` — Un lien ouvert dans un nouvel onglet porte `rel="noopener noreferrer"`.
  Pourquoi : Sans cela, la page ouverte peut piloter l'onglet dont elle vient.
- **CORE-074** · guidance — Un jeton d'authentification n'est jamais écrit dans `localStorage` ni `sessionStorage`.
  Pourquoi : N'importe quel script injecté les lit ; un cookie posé par le serveur n'a pas cette faiblesse.
- **CORE-075** · guidance — Une Content-Security-Policy est servie en production et l'application n'embarque aucun script inline.
  Pourquoi : La politique est la dernière barrière quand une injection passe.
- **CORE-076** · guidance — Une saisie utilisateur interpolée dans une URL est encodée, et une URL venue des données n'est jamais utilisée en `src` ou `href` sans vérifier son schéma.
  Pourquoi : Une URL `javascript:` stockée dans un champ s'exécute au clic.
- **CORE-077** · guidance — Les dépendances sont auditées en CI, et en ajouter une fait l'objet d'un commit séparé qui dit pourquoi elle est nécessaire.
  Pourquoi : L'arbre de dépendances du front est la plus large surface d'attaque du projet.

### Anti-patterns

- **CORE-AP-070** · `gitleaks` — Mettre une clé d'API dans une variable `VITE_` et la considérer comme privée.
  Pourquoi : La valeur se retrouve dans le bundle JavaScript, en clair.
  À la place : Garder la clé sur un serveur et l'appeler à travers le backend du projet.

### Variables d'environnement attendues

| Variable | Exemple | Rôle |
|---|---|---|
| `VITE_AUTH_LOGIN_PATH` | `/bff/login` | Chemin de l'endpoint du backend-for-frontend qui démarre la connexion. |

## Profil `next-app`

Next.js App Router, rendu sur le serveur par défaut, un dossier par cas d'usage.

### Règles

- **NEXT-010** · guidance — Une valeur réservée au serveur est lue par l'aide de configuration serveur, jamais par une variable `NEXT_PUBLIC_`.
  Pourquoi : Une valeur `NEXT_PUBLIC_` est inlinée dans le bundle et lisible par n'importe qui.
- **NEXT-014** · guidance — Un module serveur qui appelle l'API pour le compte de l'utilisateur retransmet les cookies d'authentification de la requête entrante ; un fetch serveur ne porte aucune identité par lui-même.
  Pourquoi : `credentials: include` n'a de sens que dans un navigateur ; sur le serveur il est ignoré en silence et l'appel part anonyme.

## Option `security-oidc-bff`

La session vit dans un backend-for-frontend ; le navigateur ne voit jamais de jeton.

### Règles

- **SECO-001** · guidance — Le navigateur ne manipule jamais de jeton d'accès ni de rafraîchissement ; le backend-for-frontend tient la session et pose un cookie http-only.
  Pourquoi : Un jeton lisible par JavaScript est un jeton qu'un script injecté peut voler.
- **SECO-002** · guidance — Une réponse 401 envoie l'utilisateur vers l'endpoint de connexion du backend-for-frontend, jamais dans une boucle de réessai silencieuse.
  Pourquoi : Une boucle de réessai sur une session expirée martèle l'API et laisse l'utilisateur devant un écran vide.
- **SECO-003** · guidance — Masquer une route dans le client est un confort ; l'API refuse un appel non autorisé quoi qu'affiche l'interface.
  Pourquoi : L'interface est téléchargeable et modifiable par n'importe qui.

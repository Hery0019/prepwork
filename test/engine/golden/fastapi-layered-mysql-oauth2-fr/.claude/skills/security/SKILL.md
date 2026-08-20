---
name: "security"
description: "Secrets, endpoints de diagnostic, CORS, en-têtes, scan des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Sécurité

La sécurité de base s'applique quel que soit le mode d'authentification choisi.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-030** · `gitleaks` — Les secrets et valeurs propres à un environnement viennent de variables d'environnement lues par une classe `pydantic-settings` ; `.env.example` est commité et `.env` est ignoré.
  Pourquoi : Une configuration qui diffère par environnement ne doit jamais être un changement de code, et une classe de réglages typée échoue au démarrage plutôt qu'à la première requête.
- **CORE-031** · `gitleaks` — Aucun identifiant, jeton ou clé privée n'est jamais commité ; le hook pre-commit gitleaks bloque le commit.
  Pourquoi : Un secret dans l'historique est compromis même après sa suppression.
- **CORE-032** · guidance — Le seul endpoint de diagnostic exposé est `/health` ; aucun endpoint ne renvoie la configuration, l'environnement ou des dumps.
  Pourquoi : Un endpoint de diagnostic est une fuite de configuration qui attend le premier scan.
- **CORE-033** · guidance — Les origines CORS sont une liste explicite lue depuis les réglages ; `allow_origins=["*"]` n'est jamais utilisé hors développement local.
  Pourquoi : Une origine joker fait de chaque navigateur un client de l'API.
- **CORE-034** · guidance — Les en-têtes de sécurité posés par le middleware (`X-Content-Type-Options`, `X-Frame-Options`, HSTS) ne sont jamais retirés sans ADR.
  Pourquoi : Starlette n'en pose aucun par défaut ; le squelette les ajoute et chacun ferme gratuitement une classe d'attaques navigateur.
- **CORE-035** · `pip-audit` — Une dépendance porteuse d'une vulnérabilité connue fait échouer le pipeline, `pip-audit` tournant sur le lockfile résolu.
  Pourquoi : La plupart des intrusions exploitent une vulnérabilité connue et déjà corrigée.
- **CORE-036** · `pytest` — La documentation interactive et le schéma OpenAPI ne sont servis que lorsque `APP_ENV` ne vaut pas `production`.
  Pourquoi : `/docs` publie chaque route, chaque schéma et chaque nom de champ à qui le demande.
- **CORE-037** · `pytest` — Le gestionnaire 500 répond un document problème sans le traceback ; le traceback ne va que dans les logs.
  Pourquoi : Un traceback donne à un attaquant les versions des bibliothèques et l'arborescence interne.

### Anti-patterns

- **CORE-AP-030** · `gitleaks` — Un mot de passe ou une clé d'API écrit comme valeur par défaut dans la classe de réglages.
  Pourquoi : La valeur est commitée, partagée et impossible à faire tourner par environnement.
  À la place : Un champ sans valeur par défaut, documenté dans `.env.example`, pour qu'une valeur absente échoue au démarrage.
- **CORE-AP-031** · guidance — `FastAPI(debug=True)` laissé actif hors développement local pour « aider à déboguer en recette ».
  Pourquoi : La recette est joignable et la réponse de debug affiche l'exception et le source.
  À la place : Lire les logs, qui portent la même information sans la publier.
- **CORE-AP-032** · guidance — `allow_origins=["*"]` avec `allow_credentials=True` pour faire marcher un front local.
  Pourquoi : Le raccourci part en production parce que personne ne s'en souvient, et le navigateur envoie les cookies avec.
  À la place : L'origine locale dans les réglages de développement et la vraie en production.

### Variables d'environnement attendues

| Variable | Exemple | Rôle |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://app:app@localhost:5432/app` | URL SQLAlchemy asynchrone ; le driver en fait partie et doit correspondre à la base choisie. |
| `DATABASE_URL` | `mysql+asyncmy://app:app@localhost:3306/app` | URL SQLAlchemy asynchrone ; le driver en fait partie et doit correspondre à la base choisie. |
| `OIDC_ISSUER` | `https://auth.example.com/realms/app` | Fournisseur OIDC qui émet les jetons ; l'application refuse de démarrer sans lui. |
| `OIDC_AUDIENCE` | `` | Audience attendue des jetons ; vide désactive le contrôle d'audience (SECO-003). |

## Option `security-oauth2-resource-server`

L'API valide des jetons porteurs émis par un fournisseur OIDC ; elle n'en émet jamais.

### Règles

- **SECO-001** · guidance — L'API est un serveur de ressources : elle valide des jetons porteurs et n'en émet, ne rafraîchit ni ne stocke jamais aucun.
  Pourquoi : Émettre des jetons est le métier d'un fournisseur, et un émetteur maison est l'erreur la plus coûteuse du domaine.
- **SECO-002** · guidance — Les clés de signature sont récupérées depuis l'endpoint JWKS du fournisseur et mises en cache ; aucune clé publique n'est écrite dans le dépôt.
  Pourquoi : Une clé figée dans le code survit à sa propre rotation et emporte l'API avec elle.
- **SECO-003** · `pytest` — L'émetteur, l'audience et la signature sont tous vérifiés ; le jeton n'est jamais décodé sans vérification.
  Pourquoi : `jwt.decode(token, options={"verify_signature": False})` accepte un jeton que n'importe qui peut forger.
- **SECO-004** · `pytest` — Une route qui exige une authentification le déclare par la dépendance partagée ; aucune route ne vérifie le jeton elle-même.
  Pourquoi : Un contrôle par route est un bug par route, et le document OpenAPI cesse de décrire ce qui est protégé.
- **SECO-005** · `pytest` — Un appel non authentifié répond 401 et un appel authentifié sans le scope répond 403.
  Pourquoi : Répondre 403 à un appelant anonyme cache si l'authentification aurait aidé.

### Anti-patterns

- **SECO-AP-001** · guidance — Lire les claims du jeton pour se fier à un champ `roles` sans vérifier l'émetteur.
  Pourquoi : N'importe quel fournisseur peut alors forger un jeton qui accorde n'importe quel rôle dans cette API.
  À la place : Vérifier d'abord l'émetteur, puis lire les claims du jeton vérifié.
- **SECO-AP-002** · guidance — Ajouter un jeton statique de « compte de service » accepté à côté des vrais.
  Pourquoi : Il ne peut être révoqué, n'expire jamais, et finit dans un script commité ailleurs.
  À la place : Un flux client-credentials du même fournisseur, qui expire et peut être révoqué.

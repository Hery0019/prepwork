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

## Option `security-none`

Aucune authentification ; l'API est réservée à un réseau de confiance.

### Règles

- **SECN-001** · guidance — Aucune authentification n'est configurée ; l'API ne doit être joignable que depuis un réseau de confiance.
  Pourquoi : Chaque endpoint, écritures comprises, est ouvert à quiconque atteint le port.
- **SECN-002** · guidance — Avant toute exposition publique, l'option de sécurité passe à `session` ou `oauth2-resource-server` dans `scaffold.yaml`, puis `prepwork sync` est lancé.
  Pourquoi : Le changement génère configuration et tests de façon cohérente ; un montage manuel dérive des conventions.
- **SECN-003** · `pytest` — Aucun module n'importe `fastapi.security` ; l'authentification s'ajoute en changeant d'option, jamais à la main.
  Pourquoi : Une sécurité partielle écrite à la main est pire qu'une absence explicite.

### Anti-patterns

- **SECN-AP-001** · guidance — Ajouter un contrôle d'en-tête `X-Api-Key` dans une dépendance pour « sécuriser un peu ».
  Pourquoi : Une clé statique partagée ne peut être ni révoquée, ni tournée, ni attribuée à quelqu'un.
  À la place : Changer d'option de sécurité, qui apporte un vrai schéma d'authentification et ses tests.

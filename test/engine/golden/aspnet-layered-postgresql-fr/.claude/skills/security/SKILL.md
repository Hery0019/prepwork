---
name: "security"
description: "Secrets, points de terminaison de santé, CORS, en-têtes, analyse des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Sécurité

La sécurité de base s'applique quel que soit le mode d'authentification choisi.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-030** · `gitleaks` — Les secrets et valeurs propres à un environnement viennent de variables d'environnement ; `.env.example` est commité et `.env` est ignoré.
  Pourquoi : Une configuration qui diffère par environnement ne doit jamais être un changement de code.
- **CORE-031** · `gitleaks` — Aucun identifiant, jeton ou clé privée n'est jamais commité ; le hook pre-commit gitleaks bloque le commit.
  Pourquoi : Un secret dans l'historique est compromis même après sa suppression.
- **CORE-032** · guidance — Le seul endpoint de diagnostic exposé est `/health` ; aucun endpoint ne renvoie la configuration, l'environnement ou des dumps.
  Pourquoi : Un endpoint de diagnostic est une fuite de configuration qui attend le premier scan.
- **CORE-033** · guidance — Les origines CORS sont une liste explicite lue depuis la configuration ; `AllowAnyOrigin` n'est jamais utilisé hors `Development`.
  Pourquoi : Une origine joker fait de chaque navigateur un client de l'API.
- **CORE-034** · guidance — Les en-têtes de sécurité posés par le pipeline (`X-Content-Type-Options`, `X-Frame-Options`, HSTS) ne sont jamais retirés sans ADR.
  Pourquoi : ASP.NET Core ne les pose pas par défaut ; le squelette les ajoute et chacun ferme gratuitement une classe d'attaques navigateur.
- **CORE-035** · `nuget-audit` — Un paquet porteur d'une vulnérabilité connue fait échouer le build, les avertissements de l'audit NuGet étant traités comme des erreurs.
  Pourquoi : La plupart des intrusions exploitent une vulnérabilité connue et déjà corrigée.
- **CORE-036** · guidance — Les pages d'erreur détaillées ne sont activées qu'en `Development` ; tout autre environnement répond un `ProblemDetails`.
  Pourquoi : Une stack trace donne à un attaquant les versions du framework et l'arborescence interne.

### Anti-patterns

- **CORE-AP-030** · `gitleaks` — Un mot de passe ou une clé d'API écrit dans `appsettings.json`.
  Pourquoi : La valeur est commitée, partagée et impossible à faire tourner par environnement.
  À la place : Une variable d'environnement lue par la configuration, documentée dans `.env.example`.
- **CORE-AP-031** · guidance — `app.UseDeveloperExceptionPage()` laissé hors de la branche `Development` pour « aider à déboguer en recette ».
  Pourquoi : La recette est joignable et la page affiche l'exception, le source et la configuration.
  À la place : Lire les logs, qui portent la même information sans la publier.
- **CORE-AP-032** · guidance — `AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()` pour faire marcher un front local.
  Pourquoi : Le raccourci part en production parce que personne ne s'en souvient.
  À la place : L'origine locale dans la configuration `Development` et la vraie en production.

### Variables d'environnement attendues

| Variable | Exemple | Rôle |
|---|---|---|
| `DB_CONNECTION_STRING` | `` | Chaîne de connexion à la base ; l'application refuse de démarrer sans elle. |

## Option `security-none`

Aucune authentification ; l'API est réservée à un réseau de confiance.

### Règles

- **SECN-001** · guidance — Aucune authentification n'est configurée ; l'API ne doit être joignable que depuis un réseau de confiance.
  Pourquoi : Chaque endpoint, écritures comprises, est ouvert à quiconque atteint le port.
- **SECN-002** · guidance — Avant toute exposition publique, l'option de sécurité passe à `cookie` ou `jwt-bearer` dans `scaffold.yaml`, puis `prepwork sync` est lancé.
  Pourquoi : Le changement génère configuration et tests de façon cohérente ; un montage manuel dérive des conventions.
- **SECN-003** · `arch-test` — Aucun type ne dépend de `Microsoft.AspNetCore.Authentication` ; l'authentification s'ajoute en changeant d'option, jamais à la main.
  Pourquoi : Une sécurité partielle écrite à la main est pire qu'une absence explicite.

### Anti-patterns

- **SECN-AP-001** · guidance — Ajouter un contrôle d'en-tête `X-Api-Key` dans un middleware pour « sécuriser un peu ».
  Pourquoi : Une clé statique partagée ne peut être ni révoquée, ni tournée, ni attribuée à quelqu'un.
  À la place : Changer d'option de sécurité, qui apporte un vrai schéma d'authentification et ses tests.

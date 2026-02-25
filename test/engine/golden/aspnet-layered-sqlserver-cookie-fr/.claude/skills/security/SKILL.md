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

## Option `security-cookie`

Authentification par cookie de session, pour un front servi par la même origine.

### Règles

- **SECC-001** · guidance — Chaque endpoint exige un utilisateur authentifié par défaut ; rendre l'un d'eux public est un `[AllowAnonymous]` explicite.
  Pourquoi : Un attribut oublié doit fermer, pas ouvrir.
- **SECC-002** · guidance — Le cookie est `HttpOnly`, `Secure` et `SameSite=Strict`, et ces trois réglages vivent à un seul endroit.
  Pourquoi : Chacun des trois ferme une voie de vol distincte ; en changer un est une décision de sécurité.
- **SECC-003** · guidance — L'API répond 401 et 403 ; elle ne redirige jamais vers une page de connexion.
  Pourquoi : Une 302 vers du HTML est illisible pour un client qui attend du JSON.
- **SECC-004** · guidance — La vérification des identifiants et l'endpoint de connexion sont écrits par l'équipe ; le squelette ne livre aucun magasin d'utilisateurs.
  Pourquoi : Un faux magasin d'utilisateurs généré finirait un jour en production.
- **SECC-005** · `arch-test` — Les tests métier tournent avec `Security:Enabled=false` ; l'authentification a son propre test.
  Pourquoi : Sinon chaque test devrait se connecter, et testerait la connexion plutôt que le comportement.

### Anti-patterns

- **SECC-AP-001** · guidance — `SameSite=None` pour faire marcher un front sur un autre domaine.
  Pourquoi : Le cookie part alors avec chaque requête cross-site, ce qui est exactement le CSRF.
  À la place : Servir le front depuis la même origine, ou passer à l'option `jwt-bearer`.
- **SECC-AP-002** · guidance — Stocker l'identifiant de l'utilisateur dans un second cookie non signé « pour la commodité ».
  Pourquoi : Un cookie non signé est modifiable par le client, donc c'est un contournement d'authentification.
  À la place : Lire l'identité dans `User.Claims`, que le cookie d'authentification porte signée.

---
name: "security"
description: "Secrets, Actuator, CORS, en-têtes, analyse des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification."
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
- **CORE-032** · guidance — Actuator n'expose que les endpoints `health` et `info`.
  Pourquoi : Les autres endpoints exposent la configuration, l'environnement et des dumps mémoire.
- **CORE-033** · guidance — Les origines CORS sont une liste explicite lue depuis la configuration ; `*` n'est jamais utilisé en `prod`.
  Pourquoi : Une origine joker fait de chaque navigateur un client de l'API.
- **CORE-034** · guidance — Les en-têtes de sécurité par défaut (content type options, frame options, HSTS, cache control) ne sont jamais désactivés sans ADR.
  Pourquoi : Chaque en-tête ferme gratuitement une classe d'attaques navigateur.
- **CORE-035** · `dependency-check` — Les dépendances sont analysées en CI pour les vulnérabilités connues, et une criticité bloque la livraison.
  Pourquoi : La plupart des intrusions exploitent une vulnérabilité connue et déjà corrigée.

### Anti-patterns

- **CORE-AP-030** · `gitleaks` — Un mot de passe ou une clé d'API écrit dans `application.yaml`.
  Pourquoi : La valeur est commitée, partagée et impossible à faire tourner par environnement.
  À la place : `${DB_PASSWORD}` dans la configuration et la variable documentée dans `.env.example`.
- **CORE-AP-031** · guidance — `management.endpoints.web.exposure.include: '*'` pour « tout voir ».
  Pourquoi : Variables d'environnement, beans et dumps de threads deviennent publics.
  À la place : Garder `health,info` et lire le reste dans les logs ou un backend de métriques.
- **CORE-AP-032** · guidance — `allowedOrigins("*")` pour faire marcher un front local.
  Pourquoi : Le raccourci part en production parce que personne ne s'en souvient.
  À la place : L'origine locale dans la configuration `dev` et la vraie en `prod`.

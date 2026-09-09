---
name: "api"
description: "Routeurs, schémas Pydantic, format des erreurs, pagination et versionnement. À lire avant de créer ou de modifier un endpoint."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# API et erreurs

FastAPI ne fournit pas RFC 9457 : le format d'erreur est du code du squelette, et il est le même pour tous les endpoints.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-010** · guidance — Toute réponse d'erreur utilise le format RFC 9457 et le type de média `application/problem+json`.
  Pourquoi : Les clients analysent une seule forme d'erreur ; aucun corps d'erreur ad hoc à documenter.
- **CORE-011** · `pytest` — Les gestionnaires d'exceptions sont enregistrés dans un seul module et traduisent les exceptions en réponses (400 validation, 404 introuvable, 409 conflit, 500 sans traceback).
  Pourquoi : Un point de traduction unique garde des codes de statut cohérents entre routeurs.
- **CORE-012** · `pytest` — Le gestionnaire par défaut de `RequestValidationError` est remplacé pour que les erreurs de validation soient elles aussi en RFC 9457, avec le statut 400.
  Pourquoi : FastAPI répond 422 sous une forme qui lui est propre ; la laisser fait parler deux dialectes d'erreur à l'API.
- **CORE-013** · `pytest` — Les routeurs reçoivent et renvoient des schémas Pydantic ; une entité ORM n'apparaît jamais dans la signature d'une route ni dans un `response_model`.
  Pourquoi : Le contrat de l'API ne doit pas changer parce qu'une colonne a été ajoutée.
- **CORE-014** · guidance — La validation est déclarée sur les schémas d'entrée par des champs Pydantic, pas écrite dans les services.
  Pourquoi : Les erreurs de validation deviennent automatiquement des réponses 400 et restent visibles dans le contrat OpenAPI.
- **CORE-015** · guidance — Les endpoints de liste prennent `page` et `size` et renvoient `content`, `page`, `size` et `totalElements`.
  Pourquoi : Une liste non bornée ne survit pas aux volumes de production.
- **CORE-016** · `pytest` — Chaque routeur est monté sous `/api/v1/` dès le premier jour.
  Pourquoi : Versionner coûte peu le premier jour et beaucoup une fois les clients en place.
- **CORE-017** · guidance — Les logs sont en JSON quand `APP_ENV` vaut `production`, lisibles ailleurs, et ne contiennent jamais de donnée personnelle.
  Pourquoi : Les machines lisent les logs de production, les humains les logs locaux, les régulateurs les deux.

### Anti-patterns

- **CORE-AP-010** · guidance — Renvoyer un `dict` nu ou un modèle d'erreur maison depuis une route.
  Pourquoi : Chaque endpoint invente sa forme d'erreur et les clients doivent les traiter au cas par cas.
  À la place : Lever une exception du domaine et laisser le gestionnaire enregistré produire le document problème.
- **CORE-AP-011** · guidance — Lever `HTTPException` depuis un service pour y choisir le code de statut.
  Pourquoi : Le service dépend alors de la couche web, et la même erreur répond différemment depuis un autre appelant.
  À la place : Lever une exception du domaine ; le gestionnaire la traduit en code de statut.
- **CORE-AP-012** · guidance — Construire un schéma de réponse avec `model_config = ConfigDict(from_attributes=True)` sur l'entité ORM elle-même.
  Pourquoi : L'entité reste le contrat de l'API ; chaque nouvelle colonne fuit par défaut.
  À la place : Un schéma de réponse qui liste exactement les champs exposés.

## Profil `layered`

Monolithe en couches — api, service, repository, domain, un sous-paquet chacun.

### Règles

- **PY-008** · `mypy` — Une fonction de `service` lève une exception du domaine ; elle ne renvoie jamais `None` pour dire « introuvable ».
  Pourquoi : Un `None` qui signifie une erreur est un 500 qui attend le premier appelant qui oublie de le vérifier.

### Anti-patterns

- **PY-AP-003** · guidance — Un `service` qui renvoie l'entité ORM telle quelle au routeur parce que les champs correspondent aujourd'hui.
  Pourquoi : La réponse suit alors la table, et une relation paresseuse sérialise le graphe entier.
  À la place : Un schéma de réponse construit depuis l'entité dans le routeur (CORE-013).

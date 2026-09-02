---
name: "api"
description: "Contrôleurs REST, DTO, erreurs RFC 9457, pagination et versionnement. À lire avant d'exposer ou modifier un endpoint."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# API et erreurs

Une seule forme d'erreur, des DTO explicites, des URL versionnées : le contrat de l'API est stable par construction.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-010** · guidance — Toute réponse d'erreur utilise le format RFC 9457 via le `ProblemDetail` de Spring.
  Pourquoi : Les clients analysent une seule forme d'erreur ; aucun corps d'erreur ad hoc à documenter.
- **CORE-011** · `archunit` — Exactement un `@RestControllerAdvice` traduit les exceptions en réponses (400 validation, 404 introuvable, 409 conflit, 500 sans stack trace).
  Pourquoi : Un point de traduction unique garde des codes de statut cohérents entre contrôleurs.
- **CORE-012** · `archunit` — Les contrôleurs reçoivent et renvoient des DTO ; une entité JPA n'apparaît jamais dans la signature d'un contrôleur.
  Pourquoi : Le contrat de l'API ne doit pas changer parce qu'une colonne a été ajoutée.
- **CORE-013** · guidance — Les contraintes Bean Validation sont déclarées sur les DTO d'entrée, pas dans les services.
  Pourquoi : Les erreurs de validation deviennent automatiquement des réponses 400 et restent visibles dans le contrat de l'API.
- **CORE-014** · guidance — Les endpoints de liste prennent un `Pageable` et renvoient `content`, `page`, `size` et `totalElements`.
  Pourquoi : Une liste non bornée ne survit pas aux volumes de production.
- **CORE-015** · `archunit` — Chaque contrôleur est exposé sous `/api/v1/` dès le premier jour.
  Pourquoi : Versionner coûte peu le premier jour et beaucoup une fois les clients en place.
- **CORE-016** · guidance — Les logs sont en JSON avec le profil `prod`, lisibles ailleurs, et ne contiennent jamais de donnée personnelle.
  Pourquoi : Les machines lisent les logs de production, les humains les logs locaux, les régulateurs les deux.

### Anti-patterns

- **CORE-AP-010** · guidance — Renvoyer une `Map<String, Object>` ou un record d'erreur maison depuis un contrôleur.
  Pourquoi : Chaque endpoint invente sa forme d'erreur et les clients doivent les traiter au cas par cas.
  À la place : Lever une exception du domaine et laisser l'advice unique produire un `ProblemDetail`.
- **CORE-AP-011** · guidance — Attraper les exceptions dans un contrôleur pour construire une réponse d'erreur.
  Pourquoi : La logique de traduction est dupliquée et dérive de celle de l'advice.
  À la place : Laisser l'exception remonter jusqu'au `@RestControllerAdvice`.
- **CORE-AP-012** · guidance — Masquer des champs d'entité avec `@JsonIgnore` au lieu d'écrire un DTO de réponse.
  Pourquoi : L'entité reste le contrat de l'API ; chaque nouveau champ fuit par défaut.
  À la place : Un record de réponse qui liste exactement les champs exposés.

## Profil `layered`

Monolithe en couches, un package par couche technique, dépendances strictement descendantes.

### Règles

- **LAY-006** · guidance — Une méthode de contrôleur valide son entrée, appelle une méthode de service et convertit le résultat en DTO de réponse ; rien d'autre.
  Pourquoi : Une logique métier dans un contrôleur ne peut être ni testée unitairement ni réutilisée.
- **LAY-007** · `archunit` — Les DTO de requête et de réponse sont des records Java déclarés dans `web`, nommés `*Request` et `*Response`.
  Pourquoi : Immuables, explicites, et impossibles à confondre avec une entité.
- **LAY-010** · guidance — La conversion entre DTO et objets du domaine se fait dans `web`, jamais dans `service`.
  Pourquoi : Les services restent indépendants de la forme de l'API et peuvent servir plusieurs interfaces.

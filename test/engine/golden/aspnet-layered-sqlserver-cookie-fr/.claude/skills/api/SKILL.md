---
name: "api"
description: "Contrôleurs, DTO, `ProblemDetails`, pagination et versionnement. À lire avant d'exposer ou modifier un endpoint."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# API et erreurs

Une seule forme d'erreur, des DTO explicites, des URL versionnées : le contrat de l'API est stable par construction.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-010** · guidance — Toute réponse d'erreur utilise le format RFC 9457 via `ProblemDetails`.
  Pourquoi : Les clients analysent une seule forme d'erreur ; aucun corps d'erreur ad hoc à documenter.
- **CORE-011** · `arch-test` — Exactement un `IExceptionHandler` traduit les exceptions en réponses (400 validation, 404 introuvable, 409 conflit, 500 sans stack trace).
  Pourquoi : Un point de traduction unique garde des codes de statut cohérents entre contrôleurs.
- **CORE-012** · `arch-test` — Les contrôleurs reçoivent et renvoient des DTO ; une entité du domaine n'apparaît jamais dans la signature d'un contrôleur.
  Pourquoi : Le contrat de l'API ne doit pas changer parce qu'une colonne a été ajoutée.
- **CORE-013** · guidance — Les attributs de validation sont déclarés sur les DTO d'entrée, pas dans les services.
  Pourquoi : Les erreurs de validation deviennent automatiquement des réponses 400 et restent visibles dans le contrat de l'API.
- **CORE-014** · guidance — Les endpoints de liste prennent `page` et `size` et renvoient `content`, `page`, `size` et `totalElements`.
  Pourquoi : Une liste non bornée ne survit pas aux volumes de production.
- **CORE-015** · `arch-test` — Chaque contrôleur est exposé sous `/api/v1/` dès le premier jour.
  Pourquoi : Versionner coûte peu le premier jour et beaucoup une fois les clients en place.
- **CORE-016** · guidance — Les logs sont en JSON dans l'environnement `Production`, lisibles ailleurs, et ne contiennent jamais de donnée personnelle.
  Pourquoi : Les machines lisent les logs de production, les humains les logs locaux, les régulateurs les deux.

### Anti-patterns

- **CORE-AP-010** · guidance — Renvoyer un `Dictionary<string, object>` ou un record d'erreur maison depuis un contrôleur.
  Pourquoi : Chaque endpoint invente sa forme d'erreur et les clients doivent les traiter au cas par cas.
  À la place : Lever une exception du domaine et laisser le handler unique produire un `ProblemDetails`.
- **CORE-AP-011** · guidance — Attraper les exceptions dans un contrôleur pour construire une réponse d'erreur.
  Pourquoi : La logique de traduction est dupliquée et dérive de celle du handler.
  À la place : Laisser l'exception remonter jusqu'à l'`IExceptionHandler`.
- **CORE-AP-012** · guidance — Masquer des champs d'entité avec `[JsonIgnore]` au lieu d'écrire un DTO de réponse.
  Pourquoi : L'entité reste le contrat de l'API ; chaque nouveau champ fuit par défaut.
  À la place : Un record de réponse qui liste exactement les champs exposés.

## Profil `layered`

Monolithe en couches — Api, Application, Infrastructure, Domain, un projet chacun.

### Règles

- **NET-004** · `arch-test` — Un contrôleur dépend d'un service applicatif, jamais d'un `DbContext` ni d'un dépôt.
  Pourquoi : Une requête écrite dans un contrôleur est invisible aux tests et dupliquée au prochain endpoint.
- **NET-008** · `arch-test` — Un contrôleur est `sealed` et son nom se termine par `Controller`.
  Pourquoi : Hériter d'un contrôleur pour partager du code produit des routes que personne n'attend.

### Anti-patterns

- **NET-AP-002** · guidance — Injecter le `DbContext` dans un contrôleur pour « éviter une couche inutile ».
  Pourquoi : Le cas d'usage devient intestable sans base et invisible pour le lecteur suivant.
  À la place : Un service applicatif que le contrôleur appelle et un test unitaire qui le couvre.
- **NET-AP-003** · guidance — Un service applicatif qui renvoie l'entité du domaine directement au contrôleur.
  Pourquoi : Chaque champ ajouté à l'entité est publié par l'API le jour même.
  À la place : Un DTO de réponse construit par le contrôleur, ou un type applicatif renvoyé par le service.

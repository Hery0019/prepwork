---
name: "architecture"
description: "Couches, packages, sens des dépendances et exemple de référence du projet. À lire avant de créer ou déplacer une classe."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Architecture

Le profil d'architecture dicte le squelette, les règles ArchUnit et l'exemple de référence. Une classe qui ne trouve pas sa place dans une couche est un signal : s'arrêter et demander.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `layered`

Monolithe en couches, un package par couche technique, dépendances strictement descendantes.

### Quand ce profil convient

- Une petite équipe, un seul livrable, un domaine encore en cours de découverte.
- Des applications surtout CRUD dont les règles métier tiennent dans des services.
- L'équipe connaît Spring MVC et Spring Data et ne veut aucun framework supplémentaire.

### Quand il ne convient pas

- Plusieurs domaines métier aux vocabulaires distincts qui vont diverger.
- Des équipes qui prévoient de découper la base de code par domaine plus tard.

### Couches

| Couche | Package | Peut dépendre de |
|---|---|---|
| `web` | `mg.solumada.payflow.web` | `service`, `domain` |
| `service` | `mg.solumada.payflow.service` | `repository`, `domain` |
| `repository` | `mg.solumada.payflow.repository` | `domain` |
| `domain` | `mg.solumada.payflow.domain` | rien |

### Règles

- **LAY-001** · `archunit` — Toute classe sous le package de base vit dans `web`, `service`, `repository`, `domain` ou `common`, sauf la classe d'application à la racine.
  Pourquoi : Une classe hors des couches échappe à toutes les règles d'architecture.
- **LAY-002** · `archunit` — Aucune classe de `web` n'importe depuis `repository`.
  Pourquoi : Les contrôleurs ne doivent pas court-circuiter la couche service.
- **LAY-003** · `archunit` — Les classes de `domain` ne dépendent d'aucune autre couche ni d'aucune classe Spring.
  Pourquoi : Le domaine doit être lisible et testable sans le framework.
- **LAY-009** · `archunit` — Le sens des dépendances `web -> service -> repository -> domain` est imposé par la règle ArchUnit en couches construite depuis les couches de ce profil.
  Pourquoi : La règle est la définition exécutable de l'architecture.
- **LAY-011** · `archunit` — Le code transverse (gestion des erreurs, pagination, configuration) vit dans `common` et ne dépend d'aucune couche.
  Pourquoi : Un code partagé qui dépend d'une couche entraîne cette couche partout.

### Anti-patterns

- **LAY-AP-001** · `archunit` — Un contrôleur qui injecte un repository pour « économiser un appel ».
  Pourquoi : Transactions, validation et règles métier sont contournées.
  À la place : Une méthode de service, même si elle ne fait que déléguer pour l'instant.
- **LAY-AP-002** · guidance — Un service géant par entité qui absorbe tous les cas d'usage.
  Pourquoi : Chaque changement touche le même fichier et les conflits de fusion deviennent la norme.
  À la place : Des services nommés d'après une responsabilité (`NoteArchivingService`), chacun avec quelques méthodes.
- **LAY-AP-003** · guidance — Des décisions métier écrites en `if` sur les champs de la requête dans un contrôleur.
  Pourquoi : La règle est intestable sans HTTP et invisible pour le service.
  À la place : La décision dans le service ou l'objet du domaine, couverte par un test unitaire.
- **LAY-AP-005** · guidance — Des classes utilitaires statiques (`NoteUtils`) qui servent de cachette à la logique.
  Pourquoi : Une logique statique ne peut être remplacée dans les tests et n'a pas de couche propriétaire claire.
  À la place : Une méthode sur l'objet du domaine, ou un service à la responsabilité explicite.

### Exemple de référence

`Note` : créer, lire une, lister avec pagination.

Fichiers :

- `src/main/java/mg/solumada/payflow/domain/Note.java`
- `src/main/java/mg/solumada/payflow/domain/NoteNotFoundException.java`
- `src/main/java/mg/solumada/payflow/repository/NoteRepository.java`
- `src/main/java/mg/solumada/payflow/service/NoteService.java`
- `src/main/java/mg/solumada/payflow/web/NoteController.java`
- `src/main/java/mg/solumada/payflow/web/NoteRequest.java`
- `src/main/java/mg/solumada/payflow/web/NoteResponse.java`
- `src/test/java/mg/solumada/payflow/service/NoteServiceTest.java`
- `src/test/java/mg/solumada/payflow/web/NoteControllerTest.java`
- `src/test/java/mg/solumada/payflow/repository/NoteRepositoryTest.java`
- `src/test/java/mg/solumada/payflow/NoteIT.java`
- `src/test/java/mg/solumada/payflow/architecture/LayeredArchitectureTest.java`

Règles illustrées : **LAY-001**, **LAY-002**, **LAY-005**, **LAY-007**, **LAY-008**, **LAY-010**, **CORE-011**, **CORE-012**, **CORE-013**, **CORE-014**, **CORE-015**, **CORE-020**, **CORE-022**

### Dépendances

**Autorisées sans discussion**

| Artefact | Rôle |
|---|---|
| `org.springframework.boot:spring-boot-starter-webmvc` | Contrôleurs REST (`web`). |
| `org.springframework.boot:spring-boot-starter-data-jpa` | Repositories Spring Data (`repository`) et entités JPA (`domain`). |
| `org.springframework.boot:spring-boot-starter-validation` | Bean Validation sur les DTO de requête. |
| `org.springframework.boot:spring-boot-starter-actuator` | Endpoints health et info. |
| `org.mapstruct:mapstruct` | Mappers DTO générés dans `web` quand la conversion manuelle devient répétitive. |

**Interdites**

| Artefact | Raison |
|---|---|
| `com.h2database:h2` | Les tests tournent sur le vrai moteur de base de données via Testcontainers. |
| `org.projectlombok:lombok` | Les records et constructeurs explicites couvrent le besoin ; le code généré cache ce que l'agent doit lire. |
| `org.springframework.boot:spring-boot-starter-data-rest` | Expose les entités directement comme API, ce qui contredit la règle des DTO. |
| `org.springframework.boot:spring-boot-starter-web` | Alias hérité ; le projet utilise `spring-boot-starter-webmvc`. |

**Procédure pour ajouter une dépendance**

1. Vérifier les listes `allowed` et `forbidden` ci-dessus ; un artefact interdit n'est jamais ajouté.
2. Si l'artefact n'est pas listé, le proposer avec son rôle et l'alternative envisagée, puis attendre confirmation.
3. L'ajouter dans un commit dédié (`build(deps)`), sans version lorsque le BOM Spring Boot en gère une.
4. L'enregistrer dans `docs/adr/` s'il change la façon d'écrire une couche.

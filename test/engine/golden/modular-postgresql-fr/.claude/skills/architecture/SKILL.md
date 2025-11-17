---
name: "architecture"
description: "Couches, packages, sens des dépendances et exemple de référence du projet. À lire avant de créer ou déplacer une classe."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Architecture

Le profil d'architecture dicte le squelette, les règles ArchUnit et l'exemple de référence. Une classe qui ne trouve pas sa place dans une couche est un signal : s'arrêter et demander.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `modular`

Monolithe modulaire avec Spring Modulith, un module par domaine métier, communication par événements.

### Quand ce profil convient

- Plusieurs domaines métier avec leur propre vocabulaire, qui doivent évoluer indépendamment.
- Une équipe qui veut des frontières explicites et vérifiées sans payer le prix des services distribués.
- Une base de code qu'on prévoit de découper par domaine plus tard.

### Quand il ne convient pas

- Un seul petit domaine où les modules ne seraient que de la cérémonie.
- Une équipe nouvelle sur Spring qui doit d'abord apprendre les bases du découpage en couches.

### Règles

- **MOD-001** · `modulith` — Chaque module métier est un sous-package direct du package de base ; sa racine porte l'API publique et `internal` tout le reste.
  Pourquoi : Spring Modulith déduit les frontières des modules de cette disposition et les vérifie.
- **MOD-002** · `modulith` — Un module n'utilise que les types racine d'un autre module ou ses événements ; rien sous `internal` ne traverse une frontière de module.
  Pourquoi : La racine publique est le contrat ; les internes changent sans toucher aux autres modules.
- **MOD-003** · `modulith` — Il n'existe aucune dépendance cyclique entre modules.
  Pourquoi : Un cycle transforme deux modules en un seul, simplement étalé sur deux packages.
- **MOD-005** · guidance — Un effet de bord dans un autre module est déclenché par la publication d'un événement de domaine, traité là-bas par un `@EventListener`, jamais par l'appel du service de ce module dans une transaction.
  Pourquoi : Les événements laissent les modules ignorer qui réagit, ce qui permet de les séparer plus tard.
- **MOD-006** · guidance — Les événements de domaine sont des records immuables déclarés à la racine du module émetteur, nommés au passé (`NoteCreated`).
  Pourquoi : L'événement est un fait qui a eu lieu ; les consommateurs doivent pouvoir se fier à sa forme.
- **MOD-009** · `archunit` — Le code transverse (gestion des erreurs, pagination, configuration) vit dans `common` et ne dépend d'aucun module métier.
  Pourquoi : Un package partagé qui dépend d'un module entraîne ce module partout.

### Anti-patterns

- **MOD-AP-001** · `modulith` — Importer `othermodule.internal.SomeRepository` pour « lire une ligne ».
  Pourquoi : La forme interne de l'autre module est désormais figée par un appelant étranger.
  À la place : Une méthode sur la façade publique de ce module, ou un record qu'il expose.
- **MOD-AP-002** · guidance — Un module `shared` ou `util` dont tous les autres dépendent pour des types métier.
  Pourquoi : C'est l'ancienne grosse boule de boue sous un nouveau nom.
  À la place : Les types métier restent dans le module qui les possède ; `common` ne contient que du code technique transverse.
- **MOD-AP-003** · guidance — Appeler la façade d'un autre module dans une transaction pour garder deux modules « synchronisés ».
  Pourquoi : Les deux modules échouent désormais ensemble et ne pourront jamais être déployés séparément.
  À la place : Publier un événement de domaine et laisser l'autre module réagir dans son propre `@EventListener`.
- **MOD-AP-004** · `archunit` — Un contrôleur placé à la racine du module « pour le retrouver facilement ».
  Pourquoi : Les endpoints HTTP deviennent une partie de l'API du module pour les autres modules.
  À la place : Les contrôleurs sous `internal` ; la racine expose la façade et les records.

### Exemple de référence

Module `note` (créer, lire une, lister) publiant `NoteCreated` ; module `audit` comptant les notes créées via un écouteur d'événement.

Fichiers :

- `src/main/java/mg/solumada/payflow/note/NoteService.java`
- `src/main/java/mg/solumada/payflow/note/NoteDetails.java`
- `src/main/java/mg/solumada/payflow/note/NoteCreated.java`
- `src/main/java/mg/solumada/payflow/note/NoteNotFoundException.java`
- `src/main/java/mg/solumada/payflow/note/internal/Note.java`
- `src/main/java/mg/solumada/payflow/note/internal/NoteRepository.java`
- `src/main/java/mg/solumada/payflow/note/internal/NoteController.java`
- `src/main/java/mg/solumada/payflow/note/internal/NoteRequest.java`
- `src/main/java/mg/solumada/payflow/audit/AuditLog.java`
- `src/main/java/mg/solumada/payflow/audit/internal/NoteCreatedListener.java`
- `src/test/java/mg/solumada/payflow/note/NoteServiceTest.java`
- `src/test/java/mg/solumada/payflow/note/internal/NoteControllerTest.java`
- `src/test/java/mg/solumada/payflow/note/internal/NoteRepositoryTest.java`
- `src/test/java/mg/solumada/payflow/NoteIT.java`
- `src/test/java/mg/solumada/payflow/architecture/ModularityTest.java`
- `src/test/java/mg/solumada/payflow/architecture/ModularArchitectureTest.java`

Règles illustrées : **MOD-001**, **MOD-002**, **MOD-004**, **MOD-005**, **MOD-006**, **MOD-007**, **MOD-008**, **CORE-011**, **CORE-012**, **CORE-013**, **CORE-014**, **CORE-015**, **CORE-020**, **CORE-022**

### Dépendances

**Autorisées sans discussion**

| Artefact | Rôle |
|---|---|
| `org.springframework.modulith:spring-modulith-starter-core` | Modèle des modules, vérification et support de la publication d'événements. |
| `org.springframework.modulith:spring-modulith-starter-test` | `@ApplicationModuleTest` pour démarrer un seul module dans les tests. |
| `org.springframework.boot:spring-boot-starter-webmvc` | Contrôleurs REST dans le package `internal` de chaque module. |
| `org.springframework.boot:spring-boot-starter-data-jpa` | Repositories Spring Data et entités JPA, toujours sous `internal`. |
| `org.springframework.boot:spring-boot-starter-validation` | Bean Validation sur les DTO de requête. |
| `org.springframework.boot:spring-boot-starter-actuator` | Endpoints health et info. |

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
3. L'ajouter dans un commit dédié (`build(deps)`), sans version lorsque le BOM Spring Boot ou Modulith en gère une.
4. L'enregistrer dans `docs/adr/` s'il change la façon d'écrire un module.

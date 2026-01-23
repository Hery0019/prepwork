<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# pay-flow

Payment flows

Ce fichier est le contrat de travail de l'agent pour ce dépôt. Il rassemble les conventions du projet ; chaque règle porte un identifiant stable à citer dans les plans et les revues.

## Projet

|  |  |
|---|---|
| Nom | `pay-flow` |
| Package de base | `mg.solumada.payflow` |
| Java | 21 |
| Base de données | PostgreSQL (migrations Flyway) |
| Profil d'architecture | `layered` — Monolithe en couches, un package par couche technique, dépendances strictement descendantes. |
| Sécurité | `none` |
| Docker | oui |
| CI | GitHub Actions |
| Langues | commentaires en français, documentation en français |

## Comment lire une règle

Chaque règle est une phrase vérifiable, suivie de sa raison. Le marqueur après l'identifiant dit qui la fait respecter :

- `archunit`, `spotless`, `commitlint`, `gitleaks`, `modulith`, `flyway`, `liquibase`, `dependency-check` : contrainte outillée, le build ou le commit échoue si elle est violée.
- `guidance` : règle de conduite pour l'agent, vérifiée en revue, sans outil derrière.

## Règles permanentes

Ces règles s'appliquent à chaque intervention, quel que soit le fichier touché.

- **CORE-001** — Avant tout changement non trivial (plus d'un fichier, un changement de schéma ou une nouvelle dépendance), l'agent écrit un plan court et attend confirmation.
- **CORE-002** — Une tâche est un changement cohérent et un commit ; refactoring et fonctionnalité ne sont jamais mélangés dans un même commit.
- **CORE-003** — L'agent ne crée jamais de commit `WIP`, `tmp` ou `fix later` ; un changement n'est commité que lorsque ses tests passent.
- **CORE-004** — Les tests sont écrits dans le même changement que le code qu'ils couvrent, jamais dans un commit ultérieur.
- **CORE-005** — Quand la spécification est ambiguë ou contradictoire, l'agent s'arrête et pose la question ; il ne choisit pas l'interprétation la plus probable.
- **CORE-006** — L'ajout d'une dépendance est un commit séparé qui suit la procédure de dépendances du profil.
- **CORE-007** — L'agent n'exécute jamais `git push`, `git reset --hard` ni `git clean`.
- **CORE-040** — Les identifiants du code (packages, classes, méthodes, variables, colonnes) sont toujours en anglais.
- **CORE-041** — Les commentaires et la documentation sont écrits dans la langue configurée du projet (voir la section réglages du projet).
- **CORE-042** — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.

Lire la section concernée avant de toucher au code correspondant ; les sections suivent le même découpage que les sujets du projet.

## Architecture

Le profil d'architecture dicte le squelette, les règles ArchUnit et l'exemple de référence. Une classe qui ne trouve pas sa place dans une couche est un signal : s'arrêter et demander.

### Profil `layered`

Monolithe en couches, un package par couche technique, dépendances strictement descendantes.

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

**Anti-patterns**

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

#### Quand ce profil convient

- Une petite équipe, un seul livrable, un domaine encore en cours de découverte.
- Des applications surtout CRUD dont les règles métier tiennent dans des services.
- L'équipe connaît Spring MVC et Spring Data et ne veut aucun framework supplémentaire.

#### Quand il ne convient pas

- Plusieurs domaines métier aux vocabulaires distincts qui vont diverger.
- Des équipes qui prévoient de découper la base de code par domaine plus tard.

#### Couches

| Couche | Package | Peut dépendre de |
|---|---|---|
| `web` | `mg.solumada.payflow.web` | `service`, `domain` |
| `service` | `mg.solumada.payflow.service` | `repository`, `domain` |
| `repository` | `mg.solumada.payflow.repository` | `domain` |
| `domain` | `mg.solumada.payflow.domain` | rien |

#### Exemple de référence

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

#### Dépendances

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

## Base de données et persistance

La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.

### Profil `layered`

Monolithe en couches, un package par couche technique, dépendances strictement descendantes.

- **LAY-004** · `archunit` — Les classes de `repository` sont des interfaces ou des classes annotées `@Repository` ; elles ne contiennent aucune logique métier.
  Pourquoi : La persistance est un détail ; une règle métier dans une requête est invisible pour les tests.
- **LAY-005** · `archunit` — `@Transactional` n'apparaît que sur des classes ou méthodes de `service`.
  Pourquoi : Le service est l'unité de travail ; une transaction ailleurs se chevauche ou ne s'ouvre jamais.
- **LAY-008** · `archunit` — Les entités persistantes sont déclarées dans `domain` et ne portent aucune annotation web ou JSON.
  Pourquoi : Une entité annotée pour l'API est une entité devenue l'API.

**Anti-patterns**

- **LAY-AP-004** · `archunit` — `@Transactional` sur un contrôleur ou un repository.
  Pourquoi : La transaction englobe le traitement HTTP ou est trop étroite pour être utile.
  À la place : L'annotation sur la méthode de service qui forme l'unité de travail.

### Option `migrations-flyway`

Migrations de schéma en fichiers SQL versionnés, appliquées par Flyway au démarrage.

- **FLY-001** · `flyway` — Tout changement de schéma est un nouveau fichier `src/main/resources/db/migration/V<n>__<description>.sql` ; une migration appliquée n'est jamais modifiée ni supprimée.
  Pourquoi : Flyway enregistre une empreinte par migration et refuse de démarrer si l'une a changé.
- **FLY-002** · guidance — Les migrations sont du SQL brut écrit pour le moteur de base de données du projet, sans abstraction multi-moteurs.
  Pourquoi : Le SQL qui tourne en production est celui qui a été relu.
- **FLY-003** · guidance — Hibernate valide le schéma par rapport aux entités au démarrage (`ddl-auto` vaut `validate`) et ne le génère jamais.
  Pourquoi : Un écart entre entité et table est un échec au démarrage, pas une surprise en production.
- **FLY-004** · guidance — Les descriptions de migration sont des verbes anglais en snake_case (`V3__add_note_archived_flag.sql`) et les numéros de version des entiers consécutifs.
  Pourquoi : La liste des migrations doit se lire comme l'historique du schéma.

**Anti-patterns**

- **FLY-AP-001** · `flyway` — Modifier une migration déjà appliquée pour la « corriger ».
  Pourquoi : Chaque environnement qui l'a appliquée échoue au prochain démarrage sur une empreinte différente.
  À la place : Une nouvelle migration qui modifie ce que la précédente a créé.
- **FLY-AP-002** · guidance — Passer `spring.jpa.hibernate.ddl-auto` à `update` pour éviter d'écrire une migration.
  Pourquoi : Le schéma diverge entre environnements et plus personne ne peut le reconstruire depuis le dépôt.
  À la place : Écrire la migration ; cela prend deux minutes et se relit comme du code.

### Tables

`note`

| Colonne | Type | Nullable |
|---|---|---|
| `id` | identity | non |
| `title` | string(200) | non |
| `content` | string(2000) | oui |
| `created_at` | timestamp | non |

## API et erreurs

Une seule forme d'erreur, des DTO explicites, des URL versionnées : le contrat de l'API est stable par construction.

### Règles de base

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

**Anti-patterns**

- **CORE-AP-010** · guidance — Renvoyer une `Map<String, Object>` ou un record d'erreur maison depuis un contrôleur.
  Pourquoi : Chaque endpoint invente sa forme d'erreur et les clients doivent les traiter au cas par cas.
  À la place : Lever une exception du domaine et laisser l'advice unique produire un `ProblemDetail`.
- **CORE-AP-011** · guidance — Attraper les exceptions dans un contrôleur pour construire une réponse d'erreur.
  Pourquoi : La logique de traduction est dupliquée et dérive de celle de l'advice.
  À la place : Laisser l'exception remonter jusqu'au `@RestControllerAdvice`.
- **CORE-AP-012** · guidance — Masquer des champs d'entité avec `@JsonIgnore` au lieu d'écrire un DTO de réponse.
  Pourquoi : L'entité reste le contrat de l'API ; chaque nouveau champ fuit par défaut.
  À la place : Un record de réponse qui liste exactement les champs exposés.

### Profil `layered`

Monolithe en couches, un package par couche technique, dépendances strictement descendantes.

- **LAY-006** · guidance — Une méthode de contrôleur valide son entrée, appelle une méthode de service et convertit le résultat en DTO de réponse ; rien d'autre.
  Pourquoi : Une logique métier dans un contrôleur ne peut être ni testée unitairement ni réutilisée.
- **LAY-007** · `archunit` — Les DTO de requête et de réponse sont des records Java déclarés dans `web`, nommés `*Request` et `*Response` ; seul le `PageResponse` partagé vit dans `common`.
  Pourquoi : Immuables, explicites, et impossibles à confondre avec une entité.
- **LAY-010** · guidance — La conversion entre DTO et objets du domaine se fait dans `web`, jamais dans `service`.
  Pourquoi : Les services restent indépendants de la forme de l'API et peuvent servir plusieurs interfaces.

## Tests

Trois niveaux, pas un de plus. Le bon niveau est le moins coûteux qui exerce réellement le comportement.

### Règles de base

- **CORE-020** · guidance — Il existe exactement trois niveaux de test, unitaire (sans contexte Spring), slice (`@WebMvcTest`, `@DataJpaTest`) et intégration (`@SpringBootTest` avec Testcontainers).
  Pourquoi : Chaque niveau a un coût et un rôle ; une quatrième catégorie est le début de la confusion.
- **CORE-021** · `archunit` — Les tests slice et d'intégration tournent sur le vrai moteur de base de données via Testcontainers ; H2 n'est jamais utilisé.
  Pourquoi : Les dialectes SQL diffèrent ; un test qui passe sur H2 ne prouve rien pour la production.
- **CORE-022** · guidance — Les méthodes de test sont nommées `method_condition_expectedResult`.
  Pourquoi : Le nom d'un test en échec doit dire ce qui casse sans ouvrir le fichier.
- **CORE-023** · guidance — Aucun seuil numérique de couverture n'est imposé ; un test est jugé sur ce qu'il vérifie.
  Pourquoi : Un objectif en pourcentage produit des tests sans assertion écrits pour la métrique.
- **CORE-024** · guidance — Un test unitaire ne démarre jamais de contexte Spring ; les dépendances sont passées en objets simples ou en mocks.
  Pourquoi : Un test unitaire doit tourner en millisecondes pour être lancé en permanence.
- **CORE-025** · guidance — Toute fonctionnalité est livrée avec au moins un test unitaire, plus le test slice de chaque contrôleur ou repository qu'elle ajoute.
  Pourquoi : L'exemple de référence montre un test par niveau ; le nouveau code suit la même forme.

**Anti-patterns**

- **CORE-AP-020** · guidance — Utiliser `@SpringBootTest` pour tous les tests parce que « ça marche toujours ».
  Pourquoi : La suite dure des minutes et plus personne ne la lance avant de pousser.
  À la place : Choisir le niveau le moins coûteux qui exerce le comportement testé.
- **CORE-AP-021** · guidance — Remplacer la base par H2 ou un faux en mémoire dans un test de persistance.
  Pourquoi : Le test valide le faux, pas le SQL qui tournera en production.
  À la place : Un `@DataJpaTest` sur la base Testcontainers.
- **CORE-AP-022** · guidance — Des noms de test tels que `test1`, `shouldWork` ou `testCreate`.
  Pourquoi : Le nom n'apporte aucune information quand il apparaît dans un rapport d'échec.
  À la place : `create_titleBlank_returns400` : méthode, condition, résultat attendu.

## Workflow de l'agent

Ces règles décrivent comment l'agent travaille dans ce dépôt : avant de coder, en codant, en commitant.

### Règles de base

- **CORE-001** · guidance — Avant tout changement non trivial (plus d'un fichier, un changement de schéma ou une nouvelle dépendance), l'agent écrit un plan court et attend confirmation.
  Pourquoi : Un plan relu en trente secondes évite une heure de travail dans la mauvaise direction.
- **CORE-002** · guidance — Une tâche est un changement cohérent et un commit ; refactoring et fonctionnalité ne sont jamais mélangés dans un même commit.
  Pourquoi : Historique relisible ; un commit peut être annulé sans perdre un travail sans rapport.
- **CORE-003** · guidance — L'agent ne crée jamais de commit `WIP`, `tmp` ou `fix later` ; un changement n'est commité que lorsque ses tests passent.
  Pourquoi : Chaque commit de la branche doit être un état sur lequel l'équipe peut s'appuyer.
- **CORE-004** · guidance — Les tests sont écrits dans le même changement que le code qu'ils couvrent, jamais dans un commit ultérieur.
  Pourquoi : Un changement sans ses tests n'est pas terminé ; les reporter est le meilleur moyen de ne jamais les écrire.
- **CORE-005** · guidance — Quand la spécification est ambiguë ou contradictoire, l'agent s'arrête et pose la question ; il ne choisit pas l'interprétation la plus probable.
  Pourquoi : Une mauvaise supposition coûte bien plus à défaire qu'une question à répondre.
- **CORE-006** · guidance — L'ajout d'une dépendance est un commit séparé qui suit la procédure de dépendances du profil.
  Pourquoi : Une dépendance est un engagement de long terme ; elle mérite sa propre revue.
- **CORE-007** · guidance — L'agent n'exécute jamais `git push`, `git reset --hard` ni `git clean`.
  Pourquoi : Ces actions sont irréversibles ou touchent un état partagé ; seul un humain les prend.
- **CORE-040** · guidance — Les identifiants du code (packages, classes, méthodes, variables, colonnes) sont toujours en anglais.
  Pourquoi : Frameworks, bibliothèques et documentation sont en anglais ; mélanger les langues produit `getUtilisateurById`.
- **CORE-041** · guidance — Les commentaires et la documentation sont écrits dans la langue configurée du projet (voir la section réglages du projet).
  Pourquoi : C'est l'équipe qui les lit ; la langue est un choix d'équipe enregistré une fois dans `scaffold.yaml`.
- **CORE-042** · guidance — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.
  Pourquoi : Un concept, un mot ; les synonymes dans le code sont des bugs en attente.

**Anti-patterns**

- **CORE-AP-001** · guidance — Commiter un changement à moitié fait pour « sauvegarder l'avancement ».
  Pourquoi : La branche contient alors des états qui ne compilent pas ou ne passent pas les tests.
  À la place : Terminer l'étape cohérente, lancer les tests, puis commiter ; garder le travail inachevé dans l'arbre de travail.
- **CORE-AP-002** · guidance — Deviner le comportement attendu quand la spécification n'est pas claire.
  Pourquoi : La supposition est invisible pour le relecteur et devient une décision silencieuse.
  À la place : S'arrêter et poser une question concrète qui liste les interprétations envisagées.
- **CORE-AP-003** · guidance — Glisser un refactoring dans un commit de fonctionnalité « tant qu'on y est ».
  Pourquoi : Le diff mélange intention et bruit ; le relecteur ne sait plus quelles lignes changent le comportement.
  À la place : Faire du refactoring un commit à part, avant ou après la fonctionnalité.

### Option `docker`

Dockerfile multi-étapes et compose.yaml pour l'environnement local.

- **DOCK-001** · guidance — L'image de l'application est construite par le `Dockerfile` multi-étapes depuis les sources, jamais depuis un jar construit sur un poste.
  Pourquoi : La construction est reproductible et identique en CI et sur n'importe quel poste.
- **DOCK-002** · guidance — Le conteneur tourne avec un utilisateur non root et n'expose que le port 8080.
  Pourquoi : Un processus compromis ne doit pas posséder le conteneur.
- **DOCK-003** · guidance — `compose.yaml` est l'environnement local de référence ; sa base de données utilise le même moteur et la même version majeure qu'en production.
  Pourquoi : Ce qui marche en local doit marcher en production pour les mêmes raisons.
- **DOCK-004** · guidance — La configuration arrive au conteneur par variables d'environnement ; rien de propre à un environnement n'est figé dans l'image.
  Pourquoi : Une seule image sert tous les environnements.

**Anti-patterns**

- **DOCK-AP-001** · guidance — `COPY . .` avant la résolution des dépendances dans le Dockerfile.
  Pourquoi : Chaque changement de source invalide la couche des dépendances et la construction retélécharge tout.
  À la place : Copier `pom.xml` et le wrapper d'abord, résoudre les dépendances, puis copier `src/`.

### Option `ci-github`

Pipeline GitHub Actions qui exécute la vérification Maven et l'analyse des dépendances vulnérables.

- **CIGH-001** · guidance — Chaque push sur `main` et chaque pull request exécute `./mvnw verify` sur GitHub Actions, avec Docker disponible pour Testcontainers.
  Pourquoi : Une branche qui ne passe pas `verify` n'est pas fusionnable, quoi qu'en dise le relecteur.
- **CIGH-002** · `dependency-check` — Le pipeline analyse les dépendances pour les vulnérabilités connues et échoue sur une criticité haute ou critique.
  Pourquoi : Les dépendances vulnérables sont attrapées à la pull request, pas à l'audit.
- **CIGH-003** · guidance — Le workflow n'appelle que des commandes qu'un développeur peut lancer en local (`./mvnw ...`) ; aucune logique ne vit uniquement dans le fichier de workflow.
  Pourquoi : Un échec en CI doit être reproductible sur un poste en une commande.

### Option `git`

Commits conventionnels, auteur déclaré, trailer d'agent optionnel, hooks pour les messages de commit et les secrets.

- **GIT-001** · `commitlint` — Les messages de commit suivent Conventional Commits (`type(scope): subject`, sujet de 72 caractères au plus), vérifiés par le hook `commit-msg`.
  Pourquoi : L'historique devient un changelog lisible par les machines et les humains.
- **GIT-002** · guidance — Les commits sont signés avec l'identité déclarée dans `scaffold.yaml` (`git.author`), jamais avec une valeur par défaut de la machine.
  Pourquoi : L'auteur est une décision d'équipe enregistrée une fois, pas un accident local.
- **GIT-003** · guidance — Quand `git.agent_trailer` est activé dans `scaffold.yaml`, chaque commit écrit par l'agent se termine par le trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
  Pourquoi : L'équipe distingue dans l'historique les commits écrits par l'agent.
- **GIT-004** · guidance — Les hooks de `.githooks/` sont actifs sur chaque clone (`git config core.hooksPath .githooks`) ; un commit qui les a contournés est refusé en revue.
  Pourquoi : Les hooks ne protègent le dépôt que si tout le monde les exécute.
- **GIT-005** · guidance — Les sorties de build, fichiers d'IDE et `.env` sont ignorés via `.gitignore` ; rien de produit par le build n'est jamais commité.
  Pourquoi : Le dépôt contient des sources et des décisions, rien qui puisse être régénéré.

**Anti-patterns**

- **GIT-AP-001** · guidance — `git commit --no-verify` pour passer outre un hook qui échoue.
  Pourquoi : Le hook a échoué pour une raison, un message mal formé ou un secret dans le diff.
  À la place : Corriger le message ou retirer le secret, puis commiter à nouveau.

## Sécurité

La sécurité de base s'applique quel que soit le mode d'authentification choisi.

### Règles de base

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

**Anti-patterns**

- **CORE-AP-030** · `gitleaks` — Un mot de passe ou une clé d'API écrit dans `application.yaml`.
  Pourquoi : La valeur est commitée, partagée et impossible à faire tourner par environnement.
  À la place : `${DB_PASSWORD}` dans la configuration et la variable documentée dans `.env.example`.
- **CORE-AP-031** · guidance — `management.endpoints.web.exposure.include: '*'` pour « tout voir ».
  Pourquoi : Variables d'environnement, beans et dumps de threads deviennent publics.
  À la place : Garder `health,info` et lire le reste dans les logs ou un backend de métriques.
- **CORE-AP-032** · guidance — `allowedOrigins("*")` pour faire marcher un front local.
  Pourquoi : Le raccourci part en production parce que personne ne s'en souvient.
  À la place : L'origine locale dans la configuration `dev` et la vraie en `prod`.

### Option `security-none`

Aucune authentification ; l'API est réservée à un réseau de confiance.

- **SECN-001** · guidance — Aucune authentification n'est configurée ; l'API ne doit être joignable que depuis un réseau de confiance.
  Pourquoi : Chaque endpoint, écritures comprises, est ouvert à quiconque atteint le port.
- **SECN-002** · guidance — Avant toute exposition publique, l'option de sécurité passe à `session` ou `oauth2-resource-server` dans `scaffold.yaml`, puis `prepwork sync` est lancé.
  Pourquoi : Le changement génère configuration et tests de façon cohérente ; un montage manuel dérive des conventions.
- **SECN-003** · `archunit` — Aucune classe ne dépend de `org.springframework.security` ; Spring Security s'ajoute en changeant d'option, jamais à la main.
  Pourquoi : Une sécurité partielle écrite à la main est pire qu'une absence explicite.

## Commandes

- `./mvnw verify` — compile, tests des trois niveaux, règles ArchUnit
- `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` — lance l'application avec le profil `dev`
- `./mvnw spotless:apply` — formate le code (à lancer avant chaque commit)
- `prepwork sync` — met à jour les fichiers générés après un changement de `scaffold.yaml`

## Réglages du projet

|  |  |
|---|---|
| Langue des commentaires | français |
| Langue de la documentation | français |

## Propriété des fichiers

- Les fichiers listés dans `.scaffold/manifest.json` sont générés : ne pas les éditer, ils seraient écrasés ou signalés par `prepwork sync`.
- `docs/adr/`, `docs/glossary.md` et tout le code métier appartiennent à l'équipe et ne sont jamais dans le manifeste.
- L'exemple de référence (`Note`) est généré ; le supprimer ou le modifier est un choix d'équipe, `sync` le signale sans le recréer.

## Git

- Auteur des commits : `Hery <hery@example.com>`
- Chaque commit de l'agent porte le trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Interdit à l'agent : `git push`, `git reset --hard`, `git clean`.


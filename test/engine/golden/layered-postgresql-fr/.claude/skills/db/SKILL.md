---
name: "db"
description: "Entités, repositories, transactions et migrations. À lire avant de toucher au schéma ou à la persistance."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Base de données et persistance

La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `layered`

Monolithe en couches, un package par couche technique, dépendances strictement descendantes.

### Règles

- **LAY-004** · `archunit` — Les classes de `repository` sont des interfaces ou des classes annotées `@Repository` ; elles ne contiennent aucune logique métier.
  Pourquoi : La persistance est un détail ; une règle métier dans une requête est invisible pour les tests.
- **LAY-005** · `archunit` — `@Transactional` n'apparaît que sur des classes ou méthodes de `service`.
  Pourquoi : Le service est l'unité de travail ; une transaction ailleurs se chevauche ou ne s'ouvre jamais.
- **LAY-008** · `archunit` — Les entités persistantes sont déclarées dans `domain` et ne portent aucune annotation web ou JSON.
  Pourquoi : Une entité annotée pour l'API est une entité devenue l'API.

### Anti-patterns

- **LAY-AP-004** · `archunit` — `@Transactional` sur un contrôleur ou un repository.
  Pourquoi : La transaction englobe le traitement HTTP ou est trop étroite pour être utile.
  À la place : L'annotation sur la méthode de service qui forme l'unité de travail.

### Tables

`note`

| Colonne | Type | Nullable |
|---|---|---|
| `id` | identity | non |
| `title` | string(200) | non |
| `content` | string(2000) | oui |
| `created_at` | timestamp | non |

## Option `migrations-flyway`

Migrations de schéma en fichiers SQL versionnés, appliquées par Flyway au démarrage.

### Règles

- **FLY-001** · `flyway` — Tout changement de schéma est un nouveau fichier `src/main/resources/db/migration/V<n>__<description>.sql` ; une migration appliquée n'est jamais modifiée.
  Pourquoi : Flyway enregistre une empreinte par migration et refuse de démarrer si l'une a changé.
- **FLY-002** · guidance — Les migrations sont du SQL brut écrit pour le moteur de base de données du projet, sans abstraction multi-moteurs.
  Pourquoi : Le SQL qui tourne en production est celui qui a été relu.
- **FLY-003** · guidance — Hibernate valide le schéma par rapport aux entités au démarrage (`ddl-auto` vaut `validate`) et ne le génère jamais.
  Pourquoi : Un écart entre entité et table est un échec au démarrage, pas une surprise en production.
- **FLY-004** · guidance — Les descriptions de migration sont des verbes anglais en snake_case (`V3__add_note_archived_flag.sql`) et les numéros de version des entiers consécutifs.
  Pourquoi : La liste des migrations doit se lire comme l'historique du schéma.

### Anti-patterns

- **FLY-AP-001** · `flyway` — Modifier une migration déjà appliquée pour la « corriger ».
  Pourquoi : Chaque environnement qui l'a appliquée échoue au prochain démarrage sur une empreinte différente.
  À la place : Une nouvelle migration qui modifie ce que la précédente a créé.
- **FLY-AP-002** · guidance — Passer `spring.jpa.hibernate.ddl-auto` à `update` pour éviter d'écrire une migration.
  Pourquoi : Le schéma diverge entre environnements et plus personne ne peut le reconstruire depuis le dépôt.
  À la place : Écrire la migration ; cela prend deux minutes et se relit comme du code.

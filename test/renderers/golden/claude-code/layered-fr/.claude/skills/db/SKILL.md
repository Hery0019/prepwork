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

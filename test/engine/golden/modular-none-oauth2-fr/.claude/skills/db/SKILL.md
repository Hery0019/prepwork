---
name: "db"
description: "Entités, repositories, transactions et migrations. À lire avant de toucher au schéma ou à la persistance."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Base de données et persistance

La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `modular`

Monolithe modulaire avec Spring Modulith, un module par domaine métier, communication par événements.

### Règles

- **MOD-004** · `archunit` — Entités persistantes, repositories et contrôleurs vivent dans `internal` ; la racine du module n'expose qu'une façade de service, des records et des événements.
  Pourquoi : Persistance et HTTP sont des détails d'implémentation d'un module, jamais son contrat.
- **MOD-008** · `archunit` — `@Transactional` n'apparaît que sur la façade de service d'un module.
  Pourquoi : La façade est l'unité de travail du module ; une transaction ailleurs se chevauche ou ne s'ouvre jamais.

### Tables

`note`

| Colonne | Type | Nullable |
|---|---|---|
| `id` | identity | non |
| `title` | string(200) | non |
| `content` | string(2000) | oui |
| `created_at` | timestamp | non |

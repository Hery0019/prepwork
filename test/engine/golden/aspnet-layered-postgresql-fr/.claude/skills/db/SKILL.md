---
name: "db"
description: "Entités, `DbContext`, dépôts, transactions et migrations EF Core. À lire avant de toucher au schéma ou à la persistance."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Base de données et persistance

La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `layered`

Monolithe en couches — Api, Application, Infrastructure, Domain, un projet chacun.

### Règles

- **NET-005** · `arch-test` — Une entité du domaine ne porte aucun attribut de persistance ni de sérialisation.
  Pourquoi : Un attribut est une référence à un framework que le domaine n'a pas le droit de connaître.
- **NET-006** · guidance — Le mapping relationnel est déclaré dans une `IEntityTypeConfiguration<T>` du projet `Infrastructure`.
  Pourquoi : Un fichier par entité, à côté des migrations, plutôt qu'un `DbContext` qui grossit sans fin.
- **NET-007** · `arch-test` — Une implémentation de dépôt est `internal` ; le reste de l'application ne voit que son interface.
  Pourquoi : Une implémentation publique finit injectée directement le jour où quelqu'un est pressé.

### Tables

`note`

| Colonne | Type | Nullable |
|---|---|---|
| `id` | identity | non |
| `title` | string(200) | non |
| `body` | text | non |
| `created_at` | timestamp | non |

### Ajouter une migration

Depuis la racine du dépôt :

```bash
dotnet ef migrations add <Nom> \
  --project src/Solumada.PayFlow.Infrastructure \
  --startup-project src/Solumada.PayFlow.Api
```

## Option `persistence-ef`

Persistance EF Core, ses migrations et la fixture Testcontainers des tests d'intégration.

### Règles

- **PERS-001** · `ef-migrations` — Un changement du modèle sans sa migration fait échouer le build (`dotnet ef migrations has-pending-model-changes`).
  Pourquoi : L'écart entre le modèle et le schéma se découvre sinon en production, pas en revue.
- **PERS-002** · guidance — Le `DbContext` ne déclare aucun `DbSet` ; les entités sont découvertes par leur `IEntityTypeConfiguration`.
  Pourquoi : Un contexte qui liste toutes les entités devient le fichier que chaque fonctionnalité doit modifier.
- **PERS-003** · `gitleaks` — La chaîne de connexion vient de `DB_CONNECTION_STRING` ; aucun fichier commité n'en contient.
  Pourquoi : Une chaîne de connexion porte un mot de passe, et un mot de passe commité est un mot de passe compromis.
- **PERS-004** · guidance — Une requête de lecture est `AsNoTracking` ; le suivi de modifications ne sert qu'aux écritures.
  Pourquoi : Suivre chaque entité lue coûte de la mémoire et produit des mises à jour surprenantes.
- **PERS-005** · guidance — L'application n'applique jamais les migrations au démarrage ; elles le sont par une étape de déploiement ou par la fixture de test.
  Pourquoi : Deux instances qui démarrent ensemble migreraient le même schéma en même temps.
- **PERS-006** · guidance — Une migration déjà appliquée quelque part n'est jamais modifiée ni supprimée ; une correction est une nouvelle migration.
  Pourquoi : Réécrire l'historique laisse dans un état inconnu tous les environnements qui l'ont déjà jouée.

### Anti-patterns

- **PERS-AP-001** · guidance — `Database.EnsureCreated()` pour « avoir un schéma rapidement ».
  Pourquoi : Elle contourne l'historique des migrations, et la migration suivante n'a plus rien sur quoi s'appuyer.
  À la place : `dotnet ef migrations add`, puis appliquer la migration.
- **PERS-AP-002** · guidance — Interpoler une valeur dans `FromSqlRaw`.
  Pourquoi : C'est une injection SQL, au seul endroit que l'ORM protégeait.
  À la place : `FromSql` avec une chaîne interpolée, qui produit des paramètres.
- **PERS-AP-003** · guidance — Activer le lazy loading pour éviter d'écrire un `Include`.
  Pourquoi : Les requêtes N+1 apparaissent loin du code qui les a provoquées.
  À la place : Un `Include` explicite, ou une projection qui ne lit que le nécessaire.

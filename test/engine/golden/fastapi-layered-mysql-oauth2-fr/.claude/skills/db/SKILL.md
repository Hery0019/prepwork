---
name: "db"
description: "Entités SQLAlchemy, session, dépôts, transactions et migrations Alembic. À lire avant de toucher au schéma ou à la persistance."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Base de données et persistance

La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `layered`

Monolithe en couches — api, service, repository, domain, un sous-paquet chacun.

### Règles

- **PY-005** · `import-linter` — `service` ne nomme jamais un symbole SQLAlchemy ; les instructions se construisent dans `repository`, et seule la racine de composition nomme le type de session.
  Pourquoi : Une requête écrite dans un service est une requête que personne ne retrouvera quand le schéma changera.
- **PY-006** · `pytest` — L'`AsyncSession` est reçue en paramètre ; aucun module ne crée son propre moteur ni sa propre session à l'import.
  Pourquoi : Une session construite à l'import ne peut pas être remplacée dans un test et vit pour tout le processus.

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
uv run alembic revision --autogenerate -m "<message>"
```

## Option `persistence-sqlalchemy`

Persistance SQLAlchemy, migrations Alembic et fixture Testcontainers des tests d'intégration.

### Règles

- **PERS-001** · `alembic` — Un changement du modèle sans sa migration fait échouer le pipeline (`alembic check`).
  Pourquoi : L'écart entre le modèle et le schéma se découvre sinon en production, pas en revue.
- **PERS-002** · guidance — Une migration déjà fusionnée n'est jamais modifiée ; une correction est une nouvelle migration.
  Pourquoi : Modifier une migration appliquée désynchronise tous les environnements qui l'ont déjà exécutée.
- **PERS-003** · guidance — Une migration produite par autogenerate est relue et corrigée avant d'être commitée.
  Pourquoi : L'autogenerate rate les renommages, les valeurs par défaut serveur et les changements d'index, et écrit un drop suivi d'un create à la place.
- **PERS-004** · `pytest` — Le schéma n'est jamais créé par `Base.metadata.create_all()`, tests compris ; les migrations sont le seul chemin.
  Pourquoi : Un schéma créé de deux façons fait deux schémas, et les migrations ne sont testées qu'en production.
- **PERS-005** · guidance — Le moteur et la fabrique de sessions sont créés une fois, au démarrage de l'application, et libérés à l'arrêt.
  Pourquoi : Un moteur par requête ouvre un pool de connexions par requête et épuise la base.
- **PERS-006** · guidance — Une requête est une transaction : la dépendance de session commite en cas de succès et annule en cas d'exception.
  Pourquoi : Une requête à moitié écrite est pire qu'une requête échouée, et personne ne la retrouve après coup.
- **PERS-007** · guidance — Les relations sont chargées explicitement (`selectinload`, `joinedload`) ; le chargement paresseux est désactivé sur la session asynchrone.
  Pourquoi : Le chargement paresseux lève à l'await sous asyncio, et cache une requête N+1 quand il fonctionne.

### Anti-patterns

- **PERS-AP-001** · guidance — Appeler `create_all()` dans la fixture de test parce que « les migrations sont lentes ».
  Pourquoi : La suite teste alors un schéma qu'aucun environnement n'aura jamais.
  À la place : Lancer `alembic upgrade head` une fois sur la base Testcontainers.
- **PERS-AP-002** · guidance — Écrire du SQL brut via `session.execute(text(...))` pour une lecture ordinaire.
  Pourquoi : La requête échappe au typage, échappe aux migrations et casse en silence quand une colonne est renommée.
  À la place : Une instruction `select()`, que mypy vérifie et qui suit le modèle.
- **PERS-AP-003** · guidance — Une migration qui porte une reprise de données dans la même révision que le changement de schéma.
  Pourquoi : La reprise verrouille la table pendant tout le déploiement et ne peut pas être rejouée seule.
  À la place : Une révision de schéma, puis une révision de données séparée, rejouable.

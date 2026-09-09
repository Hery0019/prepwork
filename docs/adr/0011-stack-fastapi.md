# ADR 0011 — pack `fastapi` : tenir les frontières sans compilateur

Date : 2026-09-09 · Statut : proposé

## Contexte

Quatrième pack, après `spring-boot`, `react` et `aspnet`. Les trois premiers ont répondu chacun à
leur manière à la question décisive d'ADR 0010 — **qu'est-ce qui joue le rôle d'ArchUnit ?** :

| Pack          | Qui tient les frontières                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| `spring-boot` | ArchUnit, un test compilé qui inspecte le bytecode                              |
| `react`       | `eslint-plugin-boundaries` et `dependency-cruiser`, deux configurations nommées |
| `aspnet`      | le graphe de `ProjectReference`, donc le compilateur lui-même                   |

Python est le cas qui manquait : **il n'a pas de compilateur**, et donc pas de sanction de build à
détourner. C'est précisément pour cela qu'il est intéressant. `enforced_by: compiler`, la trouvaille
du pack `aspnet`, n'a aucun analogue ici ; si le rendu et la légende lue par l'agent tiennent quand
même, c'est que l'abstraction n'était pas taillée pour .NET.

FastAPI plutôt que Django : le socle commun impose des DTO validés en entrée, des erreurs RFC 9457,
une pagination explicite et des couches. FastAPI part de ces primitives (Pydantic, injection de
dépendances, routeurs), Django part d'un découpage en applications qui recouvre mal l'axe profil.

## Décision

### 1. `import-linter` joue ArchUnit, et le bloc `architecture.layers` l'alimente directement

`import-linter` déclare des **contrats de couches** dans `pyproject.toml`, vérifiés par
`lint-imports` :

```toml
[[tool.importlinter.contracts]]
name = "PY-001-layers"
type = "layers"
layers = ["api", "service", "repository", "domain"]
containers = ["{{packageName}}"]
```

C'est le seul endroit du projet où l'ordre des couches est écrit une deuxième fois — et c'est
exactement le statut que CLAUDE.md §3 réserve déjà à `layeredArchitecture()` côté Spring : **le bloc
`architecture.layers` du `profile.yaml` alimente ce contrat**, il n'est pas retranscrit à la main.
Toutes les autres règles restent écrites une par une.

Comme côté React, la preuve d'une règle outillée est **une configuration nommée, pas un test
compilé** : l'identifiant de la règle est le `name` du contrat. Le pack déclare donc
`testBackedEnforcers: ['import-linter']` et un `carriesRuleEvidence` qui accepte `pyproject.toml`,
`.importlinter` et les `test_*.py` — la transposition littérale de la convention ArchUnit, contrôle
`check:content` compris.

Ce que `import-linter` ne sait pas dire (« un routeur expose un schéma Pydantic et jamais une entité
ORM », « un dépôt ne construit pas de réponse HTTP ») va dans des tests `pytest` qui portent l'id
dans leur nom, sur le modèle de `NET-003`.

### 2. `mypy --strict` tient la place du compilateur, et c'est une valeur en propre

Sans build, la seule barrière qui refuse du code avant exécution est le typage. Le pack épingle
**mypy en mode strict** et en fait une valeur d'`enforced_by` à part entière. Deux règles du socle
qui sont gratuites ailleurs deviennent ici des règles tenues par mypy : pas d'`Any`, et une
signature de dépôt qui nomme l'entité plutôt que `dict`.

C'est le pendant exact de `enforced_by: compiler`, avec une différence que la légende doit dire :
**la sanction n'est pas un build rouge mais une étape de CI**. Un projet dont personne ne lance
`mypy` perd la règle ; un projet .NET ne peut pas perdre son graphe de références. Le renderer
présente les deux comme outillées, et le skill `architecture` explique la nuance.

### 3. Quatre sous-paquets, pas quatre distributions

Le profil `layered` produit **un seul paquet installable** sous `src/{{packageName}}/`, découpé en
quatre sous-paquets :

| Couche       | Module                       | Peut importer          |
| ------------ | ---------------------------- | ---------------------- |
| `domain`     | `{{packageName}}.domain`     | rien                   |
| `repository` | `{{packageName}}.repository` | `domain`               |
| `service`    | `{{packageName}}.service`    | `repository`, `domain` |
| `api`        | `{{packageName}}.api`        | `service`, `domain`    |

Quatre distributions séparées, façon `aspnet`, donneraient la garantie du graphe de dépendances —
mais au prix de quatre `pyproject.toml`, d'une résolution d'environnement par paquet et d'une
cérémonie qu'aucun projet FastAPI réel ne pratique. Le pack refuse cet échange : le contrat
`import-linter` couvre les mêmes frontières, et le prix est une commande de CI au lieu d'une erreur
de build. C'est la conséquence assumée du fait que Python n'a pas de compilateur, et le skill
`architecture` le dit dans ces termes.

Le layout `src/` est retenu contre le layout plat : sans lui, un test importe le code depuis le
répertoire courant plutôt que depuis le paquet installé, et `import-linter` analyse un graphe qui
n'est pas celui que la production exécute.

### 4. `uv` épingle tout, et rien n'est demandé

- **Python 3.13**, épinglé par l'outil et écrit dans `.python-version` — comme la version de Spring
  Boot ou de .NET, jamais une question du questionnaire.
- **`uv`** comme unique gestionnaire : `pyproject.toml` pour les dépendances, `uv.lock` engagé,
  `uv sync --frozen` en CI. C'est le pendant de pnpm côté React — un lockfile déterministe et un
  binaire unique installable sur un runner sans préinstallation.
- **`ruff`** tient le lint et le format, remplaçant à lui seul Spotless et Checkstyle. Deux valeurs
  distinctes, parce que les sanctions le sont : `ruff` pour les règles, `format` pour
  `ruff format --check`.

### 5. SQLAlchemy 2.0 asynchrone, et Alembic là où `aspnet` a EF

Les entités ORM (`domain`) et les schémas Pydantic (`api`) sont **deux jeux de classes distincts**.
C'est ce qui fait tenir sans exception la règle du socle « le routeur expose un DTO, jamais une
entité » — SQLModel, qui les fusionne, aurait obligé à assouplir une règle de `core/`, ce que la
composition additive interdit.

Comme dans `aspnet`, il n'y a **pas d'axe `migrations-*`** : Alembic est le seul outil, l'axe
n'aurait qu'une valeur. Les règles de persistance, la session, la fabrique de moteur et la fixture
Testcontainers vivent dans l'option **`persistence-sqlalchemy`**, présente dès qu'une base est
choisie, sans `group` puisqu'il n'y a rien à choisir.

**La migration initiale appartient au profil**, comme côté .NET et pour la même raison : elle nomme
l'entité de l'exemple de référence, qui est une donnée du profil. Et la contrepartie est vérifiée,
pas supposée — la matrice lance **`alembic check`**, l'analogue exact de
`dotnet ef migrations has-pending-model-changes` : si la migration écrite à la main ne décrit pas le
modèle, le job est rouge.

### 6. Trois niveaux de tests, séparés par un marqueur pytest

Le `core/testing.yaml` commun impose trois niveaux et pas davantage. Ils deviennent trois répertoires
de `tests/`, distingués par un marqueur :

- `unit/` — pytest seul, aucune application ;
- `slice/` — `httpx.ASGITransport` sur l'application, couche `service` doublée ;
- `integration/` — `httpx` + Testcontainers sur la vraie base, marqués `@pytest.mark.integration`.

`pytest -m "not integration"` est ce qui sépare ce qui a besoin de Docker, exactement comme
`--filter Category!=Integration` côté .NET.

**L'équivalent Python de l'interdiction de H2 est l'interdiction de SQLite pour tester du SQL.**
C'est la règle `CORE-021` du pack : SQLite ne connaît ni les types PostgreSQL, ni les contraintes
différées, ni le SQL qu'Alembic génère.

### 7. RFC 9457 est à écrire, pas à configurer

Spring fournit `ProblemDetail`, ASP.NET fournit `ProblemDetails`. FastAPI ne fournit rien : ses
erreurs de validation sortent en `422` avec une forme qui lui est propre. Le socle du pack livre donc
**un gestionnaire d'exceptions unique** qui produit `application/problem+json` pour la validation,
le non-trouvé, le conflit et le `500` sans trace. C'est du code du squelette, pas une option — sans
lui, la règle `CORE` sur les erreurs serait une consigne invérifiable.

### 8. Ce que le pack déclare

- **`package_name`** joue le rôle de `base_package` : un identifiant Python en `snake_case`, mots
  réservés refusés, cible d'une couche écrite `{{packageName}}.api`. Le nom de distribution en
  dérive.
- **Bases** : PostgreSQL (défaut, `asyncpg`), MySQL (`asyncmy`), ou aucune — auquel cas le dépôt de
  l'exemple de référence est une liste en mémoire, comme dans les trois autres packs.
- **Options** : `security-none` | `security-session` | `security-oauth2-resource-server`,
  `persistence-sqlalchemy`, `docker`, `ci-github` | `ci-gitlab`, et le `git` commun.
- **`enforced_by`** : `import-linter`, `mypy`, `ruff`, `format`, `alembic`, `pip-audit`, `pytest`,
  `commitlint`, `gitleaks`, `none`.
- **Skills** : les six des packs Spring et ASP.NET (`architecture`, `db`, `api`, `testing`,
  `workflow`, `security`).
- **`reservedEnvPrefixes` est vide** : il n'y a pas de bundle client, donc pas de variable publique.
  Le point d'extension `envName` est ici l'identité — c'est en soi un contrôle qu'il généralise.
- **Contrats de pack tenus par convention de nom**, sur le modèle d'`AddApiSecurity` : le profil
  appelle `configure_security(app)`, que les trois options `security-*` fournissent toujours — y
  compris `security-none`, dont la version ne fait rien — et `get_session`, que l'option de
  persistance fournit dès qu'il y a une base.

### 9. Questionnaire

nom · nom de paquet (`snake_case`) · description · base [PostgreSQL] / MySQL / aucune ·
sécurité [none] / session / oauth2-resource-server (+ URL d'émetteur, qui va dans `.env.example`) ·
Docker · CI · auteur git · trailer · langues · résumé.

Le pack n'ayant qu'un profil, le questionnaire l'annonce au lieu de le demander — comportement déjà
en place depuis `aspnet`.

Non demandé : la version de Python, `uv`, `ruff`, `mypy`, l'ORM, l'outil de migration.

```yaml
scaffold_version: 1.3.0
project: { name: pay-flow, package_name: pay_flow, description: ... }
stack: { target: fastapi, database: postgresql }
profile: layered
renderer: claude-code
options: { security: none, docker: true, ci: github }
git: { author: { name: ..., email: ... }, agent_trailer: true }
language: { comments: fr, docs: fr }
```

## Conséquences

- **Le cœur ne devrait pas bouger.** Le pack s'écrit avec les points d'extension ouverts pour `react`
  puis `aspnet`. Si l'un manque, c'est un défaut de découpage : il est ouvert explicitement et
  amendé ici, jamais contourné.
- **`testBackedEnforcers` contient `import-linter`**, dont la preuve est un nom de contrat dans
  `pyproject.toml`. Le pack `fastapi` est le second, après `react`, à faire porter une preuve par une
  configuration ; c'est ce qui confirme que `carriesRuleEvidence` n'était pas un contournement React.
- **`enforced_by: mypy` est la première valeur dont la sanction est une étape de CI et non un
  artefact du build.** La légende du renderer doit pouvoir le dire sans mentir ; si elle ne le peut
  pas, elle est trop pauvre et c'est le renderer qu'il faut corriger.
- **La matrice de génération gagne un quatrième bloc** : profil × sécurité × base, soit 9 jobs,
  vérifiés par `uv sync --frozen`, `ruff format --check`, `ruff check`, `mypy`, `lint-imports`,
  `pytest -m "not integration"`, puis `alembic check` dès qu'il y a une base.
- **Docker reste hors du poste de travail** : les niveaux `integration` ne tourneront, comme pour les
  trois autres packs, que sur la matrice en pull request ou en `workflow_dispatch`.
- Le profil `vertical-slice` du pack `aspnet`, nommé par ADR 0010, reste candidat et n'est pas
  arbitré ici. Un second profil FastAPI découpé par feature suivrait la même séquence, jamais avant
  que `layered` soit vérifié de bout en bout.

## Amendements

_(à remplir en écrivant le pack, comme pour 0007 et 0010)_

**2026-09-09, en écrivant le pack et en le vérifiant sur un vrai Python.**

- **Le contrat de couches appartient au profil, dans un `.importlinter` dédié — pas au
  `pyproject.toml` du socle.** La preuve d'une règle est cherchée dans les templates de la source
  qui porte la règle : un contrat écrit par le socle ne prouverait aucune règle de profil. C'est
  d'ailleurs plus juste, puisque l'ordre des couches est une donnée du profil, exactement comme les
  tests ArchUnit côté Spring. Conséquence : une option ne peut pas contribuer de contrat, il n'y a
  qu'un fichier ; `SECN-003` devient un test et les deux règles `CI*-002` deviennent `none`, ce
  qu'elles étaient réellement.

- **L'identifiant apparaît souligné, `PY_001`, jamais avec un tiret.** Un nom de fonction Python
  n'accepte pas le tiret ; les noms de contrats suivent la même forme pour qu'il n'y ait qu'une
  convention. Même choix que NetArchTest côté `aspnet`.

- **PY-002 est un test, pas un contrat, et pour la raison d'ADR 0010 §2.** La racine de composition
  doit nommer le dépôt pour câbler la session : lui interdire l'import rendrait le câblage
  impossible. Ce qui se borne, c'est _qui_ le fait — ici trois modules, `app.py`, `routes.py` et
  `dependencies.py`, le pendant de `Program` et des méthodes `Add*`.

- **PY-005 était rompu par construction, et l'ADR ne pouvait pas le prévoir.** `import-linter`
  compte les imports indirects ; or PY-003 autorise `domain` à porter son mapping, donc toute couche
  atteint `sqlalchemy` à travers l'entité. Le contrat passe en `allow_indirect_imports` et perd
  `api`. La règle est réécrite pour dire ce que l'outil tient réellement — sans quoi la seule issue
  aurait été d'exclure des imports, ce que PY-AP-002 interdit.

- **`include_external_packages = True` est obligatoire.** Sans cette ligne, import-linter _refuse_
  de vérifier tout contrat interdisant un paquet externe. Trois contrats existaient et ne prouvaient
  rien. Aucune relecture ne l'aurait vu : seul un vrai run le dit.

- **`enforced_by: mypy` a tenu sa promesse, à un prix.** Ruff refuse les majuscules dans un nom de
  fonction (`N802`), ce qui condamne la convention « l'identifiant est dans le nom du test » : un
  `per-file-ignores` limité à `tests/` tranche. Et mypy strict signale un `type: ignore` devenu
  inutile, donc le même template doit le poser ou non selon la configuration.

- **Un point d'extension ouvert dans le cœur : `when` sur une variable d'environnement.** Le pilote
  fait partie de l'URL SQLAlchemy, donc `DATABASE_URL` n'a pas le même exemple selon la base. Sans
  condition, un projet MySQL recevait un `.env.example` annonçant `postgresql+asyncpg`. La condition
  ne porte que sur ce que `scaffold.yaml` dit déjà : le contexte complet n'existe pas encore, il
  contient `env`.

- **`UnauthorizedError` et `ForbiddenError` appartiennent au noyau.** Si chaque option de sécurité
  enregistrait ses propres gestionnaires, CORE-011 — « un seul module traduit les exceptions » —
  deviendrait faux. Le socle répond 401 et 403 ; les options se contentent de lever.

- **Deux pièges d'outillage, écrits là où ils ont mordu.** Eta suit les guillemets à l'intérieur d'un
  bloc de code : une apostrophe isolée dans un commentaire JS ouvre une chaîne qui ne se ferme
  jamais, et le rendu échoue bien plus loin. Et deux `conftest.py` hors paquet portent le même nom
  de module, ce qui fait refuser l'analyse à mypy : chaque niveau de test est un paquet.

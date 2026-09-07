---
name: "architecture"
description: "Couches, modules, sens des imports et exemple de référence du projet. À lire avant de créer un module ou d'ajouter un import."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Architecture

Le profil d'architecture dicte les couches, le contrat `import-linter` et l'exemple de référence. Un module qui ne trouve pas sa couche est un signal : s'arrêter et demander.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-050** · `mypy` — `mypy --strict` passe sur `src/` et sur `tests/` ; le pipeline échoue sinon.
  Pourquoi : C'est la seule étape qui refuse du code avant son exécution ; sans elle rien ne remplace le compilateur sur lequel les autres packs s'appuient.
- **CORE-051** · `mypy` — `Any` n'apparaît jamais dans une signature, et aucun `# type: ignore` n'est ajouté sans un commentaire qui en nomme la raison.
  Pourquoi : Un seul `Any` dans une signature désactive silencieusement la vérification pour tous les appelants en aval.
- **CORE-052** · `mypy` — Une fonction de dépôt nomme l'entité qu'elle renvoie ; elle ne renvoie jamais `dict`, `tuple` ni `Row`.
  Pourquoi : Une ligne non typée fait du service le seul endroit qui connaît les noms de colonnes, et la frontière ne veut plus rien dire.
- **CORE-053** · `ruff` — `ruff check` et `ruff format --check` passent ; la configuration vit dans `pyproject.toml` et n'est jamais contournée par un `# noqa` sans code de règle.
  Pourquoi : Un `# noqa` nu fait taire toutes les règles de la ligne, y compris celle que personne ne voulait faire taire.

### Anti-patterns

- **CORE-AP-050** · guidance — Élargir une signature à `Any` ou à `object` pour faire passer mypy.
  Pourquoi : L'erreur n'est pas corrigée, elle est déplacée à l'exécution et sur le prochain appelant.
  À la place : Nommer le vrai type, ou un `Protocol` quand seule une forme compte.
- **CORE-AP-051** · guidance — Ajouter un module à la liste `exclude` de mypy parce qu'il est « difficile à typer ».
  Pourquoi : Le module exclu est justement celui où le substitut de compilateur était nécessaire.
  À la place : Le typer, ou isoler la partie non typée derrière une fonction typée.

## Profil `layered`

Monolithe en couches — api, service, repository, domain, un sous-paquet chacun.

### Quand ce profil convient

- Une seule équipe, un seul déployable, un domaine qui n'est pas encore découpé.
- L'équipe accepte que les frontières de couches soient tenues par une étape de pipeline plutôt que par une erreur de build.
- Des API surtout CRUD dont les règles métier tiennent dans des services applicatifs.

### Quand il ne convient pas

- Plusieurs domaines métier qui ont déjà leur propre cycle de vie.
- Une équipe qui veut un paquet par fonctionnalité plutôt qu'un paquet par couche.

### Couches

| Couche | Module | Peut dépendre de |
|---|---|---|
| `domain` | `pay_flow.domain` | rien |
| `repository` | `pay_flow.repository` | `domain` |
| `service` | `pay_flow.service` | `repository`, `domain` |
| `api` | `pay_flow.api` | `service`, `domain` |

### Règles

- **PY-001** · `import-linter` — Les couches sont ordonnées `api` au-dessus de `service`, au-dessus de `repository`, au-dessus de `domain`, et une couche basse n'importe jamais une couche haute.
  Pourquoi : C'est la règle sur laquelle repose toute l'architecture ; chaque autre règle de ce profil la précise.
- **PY-002** · `pytest` — Seule la racine de composition importe `repository` ; un routeur passe par `service`.
  Pourquoi : La racine doit nommer le dépôt pour câbler la session, mais un routeur qui interroge directement contourne la frontière transactionnelle et, avec elle, les règles métier.
- **PY-003** · `import-linter` — `domain` n'importe ni `fastapi`, ni `starlette`, ni le module de session ; il peut déclarer son mapping SQLAlchemy.
  Pourquoi : L'entité est le vocabulaire commun ; elle doit se lire et se tester sans démarrer une application web.
- **PY-004** · `import-linter` — `service` n'importe aucun symbole `fastapi`, `HTTPException` compris.
  Pourquoi : Un cas d'usage doit être appelable depuis un worker ou une commande sans répondre un code de statut HTTP.
- **PY-007** · `pytest` — L'application est assemblée dans un seul module de `api`, seul endroit qui importe toutes les couches.
  Pourquoi : La racine de composition est la contrepartie du contrat de couches : un seul fichier à lire pour savoir ce qui est câblé.

### Anti-patterns

- **PY-AP-001** · guidance — Importer un dépôt depuis un routeur « juste pour une lecture, c'est plus simple ».
  Pourquoi : La lecture gagne un filtre, puis une règle, et la couche service ne décrit plus l'application.
  À la place : Une fonction de service, même de trois lignes, que le routeur appelle.
- **PY-AP-002** · guidance — Ajouter la couche aux `ignore_imports` du contrat `import-linter` pour débloquer un build.
  Pourquoi : La seule chose qui tient l'architecture est ce contrat ; une exception dedans, c'est l'architecture supprimée en silence.
  À la place : Déplacer le code dans la couche à laquelle il appartient, ou ouvrir un ADR pour changer les couches.

### Exemple de référence

Notes — créer, lire une note, lister avec pagination.

Fichiers :

- `src/pay_flow/domain/note.py`
- `src/pay_flow/repository/note_repository.py`
- `src/pay_flow/service/note_service.py`
- `src/pay_flow/api/notes.py`
- `src/pay_flow/api/schemas/note.py`
- `tests/unit/test_note_service.py`
- `tests/slice/test_notes_router.py`
- `tests/integration/test_notes_api.py`

Règles illustrées : **PY-001**, **PY-002**, **PY-004**, **PY-005**, **PY-006**, **CORE-013**, **CORE-015**, **CORE-016**

### Dépendances

**Autorisées sans discussion**

| Artefact | Rôle |
|---|---|
| `fastapi` | Le framework web lui-même, avec Pydantic et Starlette qui viennent avec. |
| `sqlalchemy` | L'ORM et le constructeur d'instructions ; rien d'autre ne touche la base. |
| `pydantic-settings` | Réglages typés lus depuis l'environnement, qui échouent au démarrage plutôt qu'à la première requête. |

**Interdites**

| Artefact | Raison |
|---|---|
| `requests` | Un client HTTP synchrone bloque la boucle d'événements ; `httpx` est déjà là pour les tests. |
| `aiosqlite` | Il n'existe que pour substituer SQLite au vrai moteur dans les tests, ce que CORE-021 interdit. |

**Procédure pour ajouter une dépendance**

1. Vérifier les listes `allowed` et `forbidden` ci-dessus ; un paquet interdit n'est jamais ajouté.
2. Dire quelle couche en a besoin et pourquoi la bibliothèque standard ne couvre pas déjà ce besoin, puis attendre confirmation.
3. `uv add <paquet>` pour une dépendance d'exécution, `uv add --dev <paquet>` pour une dépendance d'outillage ; le lockfile est commité avec.
4. Commiter l'ajout seul (`build(deps)`), séparément du code qui l'utilise.

### Le contrat de couches

Python n'a pas de compilateur : aucune de ces frontières n'est tenue par le build. C'est ce contrat de `pyproject.toml`, vérifié par `lint-imports`, qui les tient — et rien d'autre. L'ajouter aux `ignore_imports` pour débloquer un build supprime l'architecture en silence.

```toml
[[tool.importlinter.contracts]]
name = "PY-001-layers"
type = "layers"
layers = ["api", "service", "repository", "domain"]
containers = ["pay_flow"]
```

# ADR 0008 — Renderer `agents-md` : un fichier unique, et le renderer inscrit dans `scaffold.yaml`

Date : 2026-09-03 · Statut : accepté

## Contexte

CLAUDE.md §2 pose trois axes orthogonaux, dont le renderer : « la même définition YAML doit pouvoir
produire `AGENTS.md` ou `.cursor/rules` plus tard ». Jusqu'ici cet axe n'avait qu'une
implémentation, `claude-code` : la promesse n'était pas vérifiée, seulement écrite.

Une deuxième cible la met à l'épreuve, et elle a une forme franchement différente : là où Claude
Code lit un index court plus un fichier par skill, la convention `AGENTS.md` attend **un seul
fichier** à la racine du dépôt.

## Décision

### 1. Un fichier unique, les sujets deviennent des sections

`agents-md` produit `AGENTS.md` et rien d'autre. Le découpage par skill devient un découpage par
section de niveau `##` : projet, comment lire une règle, règles permanentes, puis un sujet par
section (`## Architecture`, `## Tests`…), et enfin commandes, réglages, propriété des fichiers, git.
Dans chaque sujet, les sources restent distinguées en `###` — règles de base, profil, options —
parce que l'agent doit savoir d'où vient une règle pour savoir ce qui la ferait disparaître.

Le contexte du profil (quand il convient, ses couches, son exemple de référence, ses dépendances)
et les sections apportées par le pack (contrat visuel, tables SQL) sont rendus au même endroit que
dans les skills, en `####`.

### 2. Le renderer est un champ de `scaffold.yaml`

`renderer: claude-code | agents-md`, `SCAFFOLD_VERSION` passe à `1.2.0`, et l'absence du champ vaut
`claude-code` : les projets générés avant cet ADR continuent de se synchroniser.

C'était nécessaire, pas cosmétique. Sans lui, `check` sur un projet rendu en `agents-md` recalculait
le plan avec le renderer par défaut : il aurait voulu créer `CLAUDE.md`, `.claude/skills/*` et
supprimer `AGENTS.md`. Le renderer est un choix de projet, durable, non inférable — exactement la
définition de ce qui entre dans `scaffold.yaml` (CLAUDE.md §5).

`init --renderer <id>` fixe la valeur ; le questionnaire ne la demande pas et laisse le défaut. Une
équipe qui change d'agent édite le champ et lance `prepwork sync` : les anciens fichiers de
spécification passent en `delete`, le nouveau en `create`.

### 3. Aucun pack n'a été modifié

Le renderer lit les sujets, les libellés, la légende des outils, les commandes et les sections
propres à la stack par `pack.presentation`, comme `claude-code`. Écrire `agents-md` n'a demandé
aucune ligne dans `packs/spring-boot` ni dans `packs/react` : c'est la vérification que l'axe est
réellement orthogonal.

## Conséquences

- Deux golden files supplémentaires, un par pack, tous deux rendus depuis les mêmes YAML que les
  golden files `claude-code`.
- Un test compare les identifiants de règles présents dans les skills et dans le fichier unique :
  la conversion ne perd rien (plus de cinquante identifiants, ensembles égaux).
- Un test vérifie que changer de renderer ne change que les fichiers de spécification, jamais le
  squelette.
- Le renderer n'a pas de contribution au catalogue : il ne peut ni ajouter une dépendance ni un
  fichier de squelette. Si une cible d'agent en avait besoin un jour, ce serait un pack, pas un
  renderer.

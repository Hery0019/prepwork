# ADR 0005 — Vocabulaire du plan : `unchanged` et `delete`

Date : 2026-09-02 · Statut : accepté

## Contexte

CLAUDE.md §7 fixe les opérations `create | update | skip-modified | conflict`. Deux situations
courantes n'y trouvent pas de place :

- un fichier généré identique à ce que la source produit (rien à faire, mais il faut le dire) ;
- un fichier généré autrefois que la source ne produit plus (option retirée dans `scaffold.yaml`,
  par exemple `ci: github` → `none`).

## Décision

Le plan connaît six opérations :

| Opération       | Situation                                                        | `sync`                 |
| --------------- | ---------------------------------------------------------------- | ---------------------- |
| `create`        | absent du disque                                                 | écrit                  |
| `update`        | généré, intact (empreinte = manifeste), contenu différent        | écrit                  |
| `unchanged`     | identique, ou fichier d'équipe déjà présent, ou identique adopté | rien                   |
| `skip-modified` | généré mais modifié **ou supprimé** par l'équipe                 | signalé, jamais touché |
| `conflict`      | existe sans être connu du manifeste, contenu différent           | signalé, jamais touché |
| `delete`        | dans le manifeste, intact, plus produit par la source            | supprimé               |

Un fichier `skip-modified` garde son ancienne empreinte dans le manifeste : il est signalé à chaque
`sync` tant que l'équipe ne l'a pas supprimé pour reprendre la version générée. Un fichier
supprimé par l'équipe n'est jamais recréé (CLAUDE.md §6 : « signalé, jamais écrasé »).

`prepwork check` retourne le code 1 dès que le plan contient autre chose que `unchanged`, ce qui
permet de l'utiliser en CI comme garde-fou.

## Conséquences

- `init` exige un répertoire vide (seul `.git` est toléré) : aucun `conflict` n'y est possible.
- Les fichiers d'équipe (`owner: team`) ne sont jamais `update`, `delete` ni `conflict`.

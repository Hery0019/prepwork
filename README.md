# prepwork

CLI (TypeScript) qui prépare le terrain d'un projet **Spring Boot** avant la première ligne de
code métier : squelette Maven prêt à l'emploi, exemple de référence, tests ArchUnit, et
spécifications (`CLAUDE.md` + skills) destinées à l'agent IA qui codera dans ce squelette.

## Prérequis

- Node 22 LTS (ou plus récent), `pnpm` (via `corepack enable pnpm`)
- Pour vérifier un projet généré : JDK 21 (ou 17), Docker (Testcontainers)

## Développement

```sh
pnpm install
pnpm check          # typecheck + lint + vérification de content/ + tests
pnpm check:content  # cohérence de content/ seule (ids, préfixes, orthogonalité, tests ArchUnit)
pnpm schemas        # régénère schema/*.schema.json depuis les schémas Zod
pnpm dev -- --help  # lance la CLI depuis les sources
```

## Commandes de la CLI

```sh
pnpm dev init <dir>                      # questionnaire interactif, puis génération
pnpm dev init <dir> --scaffold s.yaml    # sans questionnaire (CI, tests)
pnpm dev check <dir>                     # plan rapporté, zéro écriture ; code 1 si le projet n'est pas à jour
pnpm dev sync <dir>                      # applique les opérations sûres, signale le reste
```

| Commande      | Rôle                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [dir]`  | Questionnaire (ou `--scaffold <file>`), `scaffold.yaml`, génération complète dans un répertoire vide, puis `git init` + auteur + `core.hooksPath` (`--no-git` pour s'en passer) |
| `check [dir]` | Calcule le plan contre `.scaffold/manifest.json` et le rapporte, sans rien écrire                                                                                               |
| `sync [dir]`  | Exécute `create`, `update` et `delete` ; `skip-modified` et `conflict` sont seulement signalés                                                                                  |

Toutes acceptent `--dry-run`. Le vocabulaire du plan est décrit dans
[docs/adr/0005-vocabulaire-du-plan.md](docs/adr/0005-vocabulaire-du-plan.md).

Une fois construit (`pnpm build`), l'exécutable est `node dist/cli/index.js` (ou `prepwork` après
`npm link`).

## Structure

```
src/
  cli/            commandes init / sync / check — fines, sans logique
  questionnaire/  questions, validation des réponses → scaffold.yaml
  config/         schéma zod de scaffold.yaml, lecture/écriture
  catalog/        chargement et validation de content/ (core, profiles, options)
  engine/         composition → plan → exécution ; manifeste
  renderers/      claude-code : YAML → CLAUDE.md + .claude/skills/
content/          données uniquement : core/, profiles/, options/ — jamais de code
schema/           JSON Schema générés depuis Zod (autocomplétion IDE), jamais édités à la main
docs/adr/         décisions prises pendant l'implémentation de l'outil lui-même
```

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

| Commande              | Rôle                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| `prepwork init <dir>` | Questionnaire, `scaffold.yaml`, génération complète dans un répertoire vide  |
| `prepwork check`      | Calcule le plan de génération et le rapporte, sans rien écrire               |
| `prepwork sync`       | Met à jour les fichiers générés non modifiés par l'équipe, rapporte le reste |

Chaque commande accepte `--dry-run`.

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

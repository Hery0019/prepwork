# prepwork

A TypeScript CLI that prepares the ground for a **Spring Boot** project before the first line of
business code: a ready-to-use Maven skeleton, a reference example, ArchUnit tests, and the
specifications (`CLAUDE.md` + skills) for the AI agent that will code inside that skeleton.

## Prerequisites

- Node 22 LTS (or newer) and `pnpm` (via `corepack enable pnpm`)
- To verify a generated project: JDK 21 (or 17) and Docker (Testcontainers)

## Development

```sh
pnpm install
pnpm check          # typecheck + lint + content/ consistency check + tests
pnpm check:content  # content/ consistency only (ids, prefixes, orthogonality, ArchUnit tests)
pnpm schemas        # regenerates schema/*.schema.json from the Zod schemas
pnpm dev --help     # runs the CLI from the sources
```

## CLI commands

```sh
pnpm dev init <dir>                      # interactive questionnaire, then generation
pnpm dev init <dir> --scaffold s.yaml    # no questionnaire (CI, tests)
pnpm dev check <dir>                     # reports the plan, writes nothing; exit code 1 when out of date
pnpm dev sync <dir>                      # applies the safe operations, reports the rest
```

| Command       | Role                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `init [dir]`  | Questionnaire (or `--scaffold <file>`), `scaffold.yaml`, full generation into an empty directory, then `git init` + author + `core.hooksPath` (`--no-git` to skip) |
| `check [dir]` | Computes the plan against `.scaffold/manifest.json` and reports it, without writing anything                                                                       |
| `sync [dir]`  | Executes `create`, `update` and `delete`; `skip-modified` and `conflict` are only reported                                                                         |

All three accept `--dry-run`. The plan vocabulary is described in
[docs/adr/0005-vocabulaire-du-plan.md](docs/adr/0005-vocabulaire-du-plan.md).

Once built (`pnpm build`), the executable is `node dist/cli/index.js` (or `prepwork` after
`npm link`).

## Shipped catalogue

| Axis          | v1 values                                                                         |
| ------------- | --------------------------------------------------------------------------------- |
| Profile       | `layered` (default), `modular` (Spring Modulith, events)                          |
| Migrations    | `migrations-flyway` (default), `migrations-liquibase` — absent without a database |
| Security      | `security-none` (default), `security-session`, `security-oauth2-resource-server`  |
| Other options | `docker`, `ci-github` (default) / `ci-gitlab`, `git` (always present)             |

Generated projects target Spring Boot 4.1.1 (version pinned in `src/engine/context.ts`). The CI of
this repository (`.github/workflows/ci.yaml`) generates every profile × security × migrations
combination and runs `mvn verify` on each of them for pull requests.

## Layout

```
src/
  cli/            init / sync / check commands — thin, no logic
  questionnaire/  questions, answer validation → scaffold.yaml
  config/         zod schema for scaffold.yaml, read/write
  catalog/        loading and validation of content/ (core, profiles, options)
  engine/         composition → plan → execution; manifest
  renderers/      claude-code: YAML → CLAUDE.md + .claude/skills/
content/          data only: core/, profiles/, options/ — never code
schema/           JSON Schema generated from Zod (IDE completion), never hand-written
docs/adr/         decisions taken while implementing the tool itself
```

# CLAUDE.md — prepwork

CLI tool (TypeScript) that prepares the ground for a project before the first line of business code:
it generates a skeleton — Spring Boot, React or ASP.NET Core, one pack per stack — plus a set of
specifications (`CLAUDE.md` + skills) for the AI agent that will code inside that skeleton.

This file is the single source of truth for project decisions. It was written at the end of a full
design phase. Decisions marked **fixed** are not reopened without an explicit request.

---

## 1. What the tool does and does not do

**Does:**

- Runs a questionnaire with a human, produces `scaffold.yaml`, generates a ready-to-use repo for the
  chosen stack.
- Generates the convention files for Claude Code (`CLAUDE.md`, `.claude/skills/*`), ADRs, and a
  manifest of generated files.
- Can be re-run on an existing project (`sync`) to update the files it owns.

**Does not (v1, fixed):**

- No business code generation. The reference example is deliberately trivial.
- No microservices, no hexagonal profile, no home-made JWT, no raw SQL scripts without a migration
  tool. Per pack: Maven only on `spring-boot` (no Gradle), pnpm only on `react`, the .NET SDK only
  on `aspnet`, `uv` only on `fastapi`.
- No stack beyond the four shipped packs. A fifth one is an ADR before it is a directory
  (0007 for `react`, 0010 for `aspnet`, 0011 for `fastapi`), never a variant grafted onto an
  existing pack.
- No three-way merge during `sync`. A generated file that the team has since modified is reported,
  never overwritten or merged.

---

## 2. Core model (fixed)

A project first picks a **stack**, which selects the content pack. Inside a pack, three
**orthogonal** axes. A cross-dependency between two axes is a design bug, not a detail to
work around.

| Axis         | Role                                                                                                                                                                                                                                                              | Cardinality                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Stack**    | The target technology. Selects the pack (`spring-boot`, `react`, `aspnet`, `fastapi`) that supplies `core/`, profiles, options, contributions and the post-processing hook. See §11 and ADR 0007, §12 and ADR 0010, §13 and ADR 0011.                             | Exactly one per project       |
| **Profile**  | The architecture. Dictates the skeleton, ArchUnit rules, anti-patterns, reference example.                                                                                                                                                                        | Exactly one per project       |
| **Option**   | Profile-independent overlay: `docker`, `migrations-*`, `security-*`, `ci-*`, `git`. Adds its files and its spec fragment. Knows nothing about the profile. An option that names no technology lives in `content/common/options` and serves every pack (ADR 0009). | 0..n, some mutually exclusive |
| **Renderer** | Output for one agent target: `claude-code` (index + one file per skill) or `agents-md` (a single `AGENTS.md`). Recorded in `scaffold.yaml`; a renderer never contributes a dependency or a skeleton file (ADR 0008).                                              | One per project               |

On top of these three axes sits a **`core/` base**: rules that hold regardless of profile (agent
workflow, API and errors, testing, baseline security). **Additive composition only**: profiles and
options add rules to the base; they never override or remove a base rule. If you feel the need to
introduce an override mechanism, stop and flag it: the split is what needs fixing.

### v1 profiles of the `spring-boot` pack (the others: §11, §12, §13)

- `layered` — layered monolith `web` / `service` / `repository` / `domain`. Default profile.
- `modular` — modular monolith with Spring Modulith, modules per business domain, event-based
  communication, `ApplicationModules.verify()` in tests.

### v1 options (`spring-boot` pack)

- `migrations-flyway` (default) | `migrations-liquibase` — exclusive, absent when there is no database.
- `security-none` (default) | `security-session` | `security-oauth2-resource-server` — exclusive.
- `docker` — multi-stage `Dockerfile` + `compose.yaml` with the chosen database.
- `ci-github` (default) | `ci-gitlab` — exclusive, optional.
- `git` — always present: conventional commits, author, optional agent trailer.

---

## 3. Rule format (fixed)

Every rule, whether in `core/`, a profile or an option, is **one atomic, verifiable sentence** with
four fields. No paragraphs in YAML; connecting prose belongs to the renderer.

```yaml
rules:
  - id: LAY-002 # prefix by source: CORE-, LAY-, MOD-, SEC-, DOCK-…
    statement: No class in `web` imports from `repository`.
    rationale: Controllers must not bypass the service layer. # mandatory
    enforced_by: archunit # archunit | spotless | commitlint | gitleaks | none
```

`enforced_by: none` means "guidance for the agent"; any other value means "tooled constraint". The
renderer **must** make this distinction visible in the generated Markdown.

Anti-patterns: same format, plus an `instead` field.

### ArchUnit tests (fixed)

Hand-written, never generated from YAML. Each test carries the rule id in its name
(`LAY_002_web_does_not_depend_on_repository`). A tool check verifies that every rule with
`enforced_by: archunit` has a test with that id. Single exception: the `architecture.layers` block
directly feeds a `layeredArchitecture()` rule.

### `profile.yaml` structure

```yaml
meta: { id, version, summary, when_to_use, when_not_to_use }
architecture:
  base_package: '{{basePackage}}'
  layers: [{ id, package, may_depend_on: [] }]
rules: [...]
anti_patterns: [...]
dependencies:
  allowed: [{ artifact, purpose }]
  forbidden: [{ artifact, rationale }]
  add_procedure: ...
reference_example: { feature, files: [], demonstrates: [rule ids] }
skills: { architecture: [...], db: [...], api: [...], testing: [...], workflow: [...] }
```

---

## 4. `core/` content (validated — to be transcribed into rules)

**Agent workflow** (`core/workflow.yaml`)

- Short plan before any non-trivial change (non-trivial = more than one file, or a schema change,
  or a new dependency), then wait for confirmation.
- One task = one coherent change = one commit. No WIP commits, no mixing refactoring and features.
- Tests written in the same change as the code.
- Ambiguous or contradictory spec → the agent stops and asks. It does not improvise.
- Adding a dependency: separate commit, following the profile's procedure.
- Forbidden to the agent: `git push`, `reset --hard`, `clean`, deleting a migration.

**API and errors** (`core/api.yaml`)

- Errors in RFC 9457 format via `ProblemDetail` (Spring 6). A single `@RestControllerAdvice`:
  validation, not found, conflict, generic 500 with no stack trace.
- Controllers expose DTOs, never JPA entities (ArchUnit-enforced).
- Bean Validation on input DTOs, not in services.
- Pagination with `Pageable`; response `content` / `page` / `size` / `totalElements`.
- Versioned URLs `/api/v1/...` from day one.
- JSON logs in prod, human-readable in dev; never any personal data.

**Testing** (`core/testing.yaml`)

- Three levels, no more: unit without Spring; slice (`@WebMvcTest`, `@DataJpaTest`); integration
  `@SpringBootTest` + Testcontainers on the real database. **No H2.**
- Naming `method_condition_expectedResult`.
- No numeric coverage target.
- The reference example includes one test of each level.

**Baseline security** (`core/security.yaml`, independent of the `security-*` option)

- Secrets via environment variables; `.env.example` committed, `.env` ignored; gitleaks pre-commit hook.
- Actuator: `health` and `info` only.
- Explicit CORS, never `*` in prod. Spring Security default security headers.
- CI option: vulnerable dependency scan (OWASP Dependency-Check or equivalent).

**Language** (`core/language.yaml`)

- Code identifiers **always in English** (fixed). Only `comments` and `docs` are configurable.
- `docs/glossary.md` generated empty, team-owned, optional.

---

## 5. Questionnaire and `scaffold.yaml` (fixed)

The questionnaire below belongs to the `spring-boot` pack; the `react` one is in §11, the `aspnet`
one in §12, the `fastapi` one in §13. Order, with defaults in brackets:

1. Project name (kebab-case) 2. Base package (regex-validated) 3. One-line description
2. Java [21] / 17 5. Database [PostgreSQL] / MySQL / Oracle / none → 5a. Migrations [Flyway] / Liquibase
3. Profile [layered] / modular (show `when_to_use`)
4. Security [none] / session / oauth2-resource-server → 7a. Issuer URL (goes to `.env.example`, not `scaffold.yaml`)
5. Docker [yes] 9. CI [github] / gitlab / none
6. Git author (name, email, prefilled from global config) 11. `Co-Authored-By` trailer [yes]
7. Comments language [fr] / en 13. Documentation language [fr] / en
8. Summary + confirmation.

Not asked: build tool (Maven), Spring Boot version (pinned by the tool version).
Show a warning about the Testcontainers image size when Oracle is selected.

```yaml
scaffold_version: 1.0.0
project: { name: pay-flow, base_package: mg.solumada.payflow, description: ... }
stack: { java: 21, database: postgresql, migrations: flyway }
profile: layered
options: { security: none, docker: true, ci: github }
git: { author: { name: ..., email: ... }, agent_trailer: true }
language: { comments: fr, docs: fr }
```

`scaffold.yaml` is the only input of `sync` and `check`. It contains nothing inferable and nothing secret.

---

## 6. Generated output

```
<project>/
  scaffold.yaml
  CLAUDE.md                 # short index, points to the skills
  .claude/skills/           # architecture, db, api, testing, workflow, security
  docs/adr/                 # one ADR per questionnaire choice — team-owned
  docs/glossary.md          # team-owned
  .scaffold/manifest.json   # { scaffold_version, profile_version, files: [{ path, hash }] }
  src/…                     # profile skeleton + reference example + ArchUnit tests
```

Ownership rules: every file listed in the manifest is "generated, do not edit, change the source".
ADRs, the glossary and business code are never in the manifest.

---

## 7. CLI architecture (fixed)

```
src/
  cli/            init / sync / check commands — thin, no logic
  questionnaire/  prompter, scripted prompter, result type (the questions belong to a pack)
  config/         shared scaffold.yaml fragments, read/write, stack.target detection
  catalog/        loading and validation of content/ (core, profiles, options)
  engine/         composition → plan → execution; manifest
  packs/          one directory per stack: scaffold schema, catalog schemas, contributions,
                  template context, postProcess hook, renderer strings, questionnaire
    spring-boot/ react/ aspnet/ fastapi/
  renderers/
    markdown.ts   markdown helpers, shared by renderers and packs
    claude-code/  YAML → CLAUDE.md + .claude/skills/
    agents-md/    YAML → a single AGENTS.md (ADR 0008)
content/          data only: common/{core,options}, spring-boot/, react/, aspnet/, fastapi/ — never code
```

`cli/` may import `questionnaire/`, `config/`, `engine/` and `packs/` (it resolves the pack).
`renderers/` knows nothing about `cli/` or `questionnaire/`; it reaches the stack only through
`pack.presentation`. A pack may import from the core; the core imports a pack only as a type.

### The "plan" abstraction

The engine never writes files directly. It first produces a **plan**: a list of operations
`create | update | skip-modified | conflict`, each with path, rendered content and hash. A separate
step executes the plan.

- `init`: plan on an empty directory, full execution.
- `sync`: plan against the manifest, executes only safe `update`s (unchanged hash), reports the rest.
- `check`: plan computed, report, zero writes.
- `--dry-run`: available on all three.

### Stack

- Node 22 LTS, strict TypeScript, ESM, `pnpm`.
- `commander` (commands), `@clack/prompts` (questionnaire), `yaml`, `vitest`.
- **Zod** is the source of truth for schemas; JSON Schema is generated from Zod for IDE
  autocompletion, never hand-written.
- **Eta** for templates (`<% %>`) — no Handlebars/Mustache, `{{ }}` conflicts with Spring/SpEL.

### TypeScript conventions

- No `any`. No class where a function will do. Typed domain errors, never `throw "string"`.
- Every `src/` module has a clear boundary; `cli/` may only import `questionnaire/`, `config/` and
  `engine/`. `renderers/` knows nothing about `cli/` or `questionnaire/`.
- Dependencies passed as parameters (paths, file system) so everything is testable without real I/O.

---

## 8. Tool tests and CI (fixed)

- Unit: engine, renderers, catalog, questionnaire. Compared against committed golden files.
- `content/` consistency check: every `enforced_by: archunit` rule has its test; schemas valid; no
  cross-dependency profile ↔ option. Runs on every commit.
- **Generation matrix, one per pack**, on pull requests and on manual `workflow_dispatch` — never
  on a push to `main`, which runs `pnpm check` alone. The matrices are the only place where the
  Testcontainers levels ever run, so a change to `content/`, to a template or to a pack goes
  through a branch and a pull request; landing it straight on `main` means it was never verified
  beyond compilation. `spring-boot`: every profile ×
  security × Flyway/Liquibase/none, then `mvn verify` (Docker required for Testcontainers).
  `react`: every profile × data × forms × security, then `pnpm typecheck && lint && test && build`
  on the generated project. `aspnet`: every profile × security × database, then `dotnet format
--verify-no-changes`, `build`, `test`, plus `dotnet ef migrations has-pending-model-changes` when
  there is a database — the shipped migration and its snapshot must describe exactly the model.
  A template that no longer compiles is a red test, not a surprise.
- `content/` consistency is checked for every pack: a rule whose `enforced_by` is test-backed must
  carry its identifier in a test (ArchUnit, NetArchTest) or in a lint configuration (ESLint
  boundaries). `enforced_by: compiler` is the exception, and the only one: the proof is a missing
  project reference, so there is no test to look for (ADR 0010 §1).

---

## 9. Implementation order

Proceed strictly in this order. Do not start a step until the previous one is verified and committed.

1. **Zod schemas + YAML content** for `core/` and the `layered` profile. Content first: writing the
   real YAML surfaces schema flaws before any code depends on it.
2. **`claude-code` renderer** — produce a real `CLAUDE.md` and skills from the YAML, for human review.
3. **`layered` skeleton** with the reference example (`Note` entity: entity → migration →
   repository → service → controller → one test per level) and ArchUnit tests. Verified by a manual
   `mvn verify`.
4. **Engine** (plan + manifest) and the `init` command.
5. `check`, then `sync`.
6. `modular` profile, then remaining options, then the CI matrix.

Steps 1 to 6 are done and committed (2026-09-02). The `spring-boot` pack is verified: `pnpm check`
green, and the 18-combination generation matrix builds with Maven.

Then, for the `react` pack (ADR 0007, same discipline — one step at a time, verified and committed):

7. ~~**Core extraction**~~ _(done)_: `stack.target` in `scaffold.yaml`, pack-declared `enforced_by` and skill
   names, generic contributions, `postProcess` hook, `content/` split into `common/`,
   `spring-boot/`, `react/`. No React content. The 5 golden files and the 18/18 matrix must stay
   green **unmodified** — a golden file that changes here means the core changed behaviour.
8. ~~**Zod schemas + YAML content** for the `react` pack~~ _(done: 8 core rule sets, the `spa-feature` profile and 15 options; two React golden renders)_.
9. ~~**Rendered `CLAUDE.md`** for a React project, reviewed by a human~~ _(done)_.
10. ~~**`spa-feature` skeleton**~~ _(done: 74 files; both variants verified by `pnpm typecheck`,
    `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm e2e` in a real Chromium)_.
11. ~~**React questionnaire**, then the front generation matrix~~ _(done)_.

Then, for the `aspnet` pack (ADR 0010, same discipline):

12. ~~**Zod schemas + YAML content** for the `aspnet` pack~~ _(done: 5 core rule sets, the `layered`
    profile and 8 options; three golden renders)_.
13. ~~**`layered` skeleton**~~ _(done: four projects plus a test project, the `Note` reference
    example, the initial EF migration and its snapshot written by hand, NetArchTest suite;
    verified on a real SDK by `dotnet format`, `build` and `test`)_.
14. ~~**ASP.NET questionnaire**, then the third generation matrix~~ _(done: 9 combinations)_.

Then, for the `fastapi` pack (ADR 0011, same discipline):

15. ~~**Zod schemas + YAML content** for the `fastapi` pack~~ _(done: 6 core rule sets — the five
    usual ones plus `typing`, which has no equivalent elsewhere — the `layered` profile and 7
    options)_.
16. ~~**`layered` skeleton**~~ _(done: the `notes` reference example, the `.importlinter` contract
    owned by the profile, the hand-written initial Alembic migration; verified on a real Python
    installed by `uv` — `ruff format --check`, `ruff check`, `mypy --strict`, `lint-imports` and
    `pytest -m "not integration"` on five configurations)_.
17. ~~**FastAPI questionnaire**, then the fourth generation matrix~~ _(done: 9 combinations)_.

**Four packs, both renderers, both React profiles, and the `layered` profile of ASP.NET and of
FastAPI are complete for v1** (2026-09-09), the `git` option is shared through
`content/common/options`, and `pnpm check` is green (131 tests, four catalogues at 0 error and 0
warning). Nothing is started beyond that. The next candidate named by an ADR — not started, not
scheduled — is the `vertical-slice` profile of the `aspnet` pack (Minimal APIs split per feature,
ADR 0010 §Conséquences), which would follow the same sequence as `spa-feature` → `next-app`.

---

## 10. How to work in this repo

- Before any non-trivial change: short plan (files touched, approach), wait for confirmation. This
  repo applies to itself the workflow it imposes on generated projects.
- Ambiguity or contradiction with this file → stop and ask. Do not pick "the most likely solution".
- One commit per coherent change, conventional commits (`feat(engine): …`, `fix(renderer): …`),
  trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Never `git push`; never a destructive command. The agent commits, the human pushes.
- A change to `content/`, to a template or to a pack is committed on a branch, not on `main`: the
  generation matrices only run on a pull request or a manual `workflow_dispatch` (§8). A
  documentation-only change may go straight to `main`.
- Docker is absent from the workstation: locally, everything is verifiable except the Testcontainers
  levels. Do not present a local `mvn verify` or `dotnet test` as a full verification — say which
  levels were skipped.
- Any decision not covered here that affects architecture is proposed before being coded, then
  recorded in this file or in `docs/adr/`.
- Code comments in French; identifiers in English.

---

## 11. The `react` pack (fixed — rationale in ADR 0007)

Two profiles. **`spa-feature`**: a Vite SPA talking to an HTTP API. **`next-app`**: Next.js App
Router, reads in server components, writes through server actions, `server-only` on the api module
so a client import fails at build time. Both keep the same four layers, the same visual contract and
the same interface kit; what changes is how the application boots and where the data is read. The
bootstrap files live in `core/` conditioned on the profile — the core is the only place that knows
both axes. Pinned by the tool, never asked: pnpm, strict TypeScript, React 19, Vitest, and per
profile Vite or Next.

**Layers** — `app/` (bootstrap and routes; the Next router in `next-app`) → everything; `features/<f>/` (`ui/`, `model/`,
`api/`) → `entities/`, `shared/`; `entities/<e>/` → `shared/`; `shared/` (`ui/`, `lib/`, `config/`)
→ nothing. Two structural rules: a feature never imports another feature (they are composed in
`app/`), and only a layer's public index is imported, never an internal file. Enforced by
`eslint-plugin-boundaries` and `dependency-cruiser`, with the rule id in the lint rule name
(`SPA-002`) — the exact transposition of the ArchUnit convention, including the `content/` check
that every tooled rule has its configuration entry.

**`enforced_by` values**: `eslint-boundaries`, `dependency-cruiser`, `typescript`, `eslint`,
`jsx-a11y`, `stylelint`, `prettier`, `vitest`, `playwright`, `commitlint`, `gitleaks`, `none`.
**Skills**: `architecture`, `ui`, `a11y`, `data`, `testing`, `workflow`, `security` — accessibility
is its own skill, not a chapter of `ui`.

**Visual contract** — in Tailwind 4 the configuration is CSS (`@theme`), so the preset _is_ the
token file. Three presets (`app-sober` default, `editorial`, `dense`), each fixing font families,
modular scale, allowed weights, line height, base-4 spacing scale, radii, breakpoints and a
**semantic** palette (`background`, `surface`, `text`, `muted`, `border`, `primary`, `destructive`,
`success`) in light and dark, checked at AA contrast. Dark theme is a redefinition of the same
tokens, never a second palette. Rules: tokens only — no raw hex, no arbitrary Tailwind value, no
`!important`; and five mandatory component states (loading, empty, error, disabled,
`focus-visible`).

**Ownership** — `tokens.css` is **generated** from the preset; `tokens.override.css` is a **team
file** imported right after it, where redeclaring a token wins. That split is what makes a change
of preset in `scaffold.yaml` actually propagate while the brand stays the team's. The shadcn
components copied into `shared/ui/` are team files too; `app.css` and the lint configuration that
constrains token usage stay generated.

**Testing** — the same three levels as Spring: unit (pure logic), component (Testing Library +
MSW), e2e (Playwright) on the reference journey. MSW is to the front what Testcontainers is to the
back: no fake at the boundary. Selection by role and label, never by CSS class.

**Reference example** — the `notes` feature, mirroring the Spring one: paginated list with its
three states, validated creation form, detail view; one test per level.

**Questionnaire** — name · description · data · forms · client state · authentication (+ login path
for the BFF, which goes to `.env.example`) · i18n · e2e · Docker · CI · design preset · dark theme ·
git author · trailer · languages · summary. The profile is asked as soon as a pack ships more than
one; a pack that has a single profile announces it instead.

`core/workflow.yaml` is stack-independent and lives in `content/common/`, consumed by every pack.

---

## 12. The `aspnet` pack (fixed — rationale in ADR 0010)

One profile for v1. **`layered`**: four projects under `src/` — `<Root>.Domain` (no reference),
`<Root>.Application` (→ `Domain`), `<Root>.Infrastructure` (→ `Application`, `Domain`),
`<Root>.Api` (→ the three others) — plus one test project under `tests/`. Pinned by the tool, never
asked: .NET 10 LTS, the SDK named by the generated `global.json`, EF Core for persistence, xUnit
plus NetArchTest and Testcontainers for the tests.

**What the compiler holds** — a boundary missing from the reference graph does not compile. Three
rules that Spring must entrust to ArchUnit are here proved by an absent `ProjectReference`, hence a
pack-specific value **`enforced_by: compiler`**: the first tooled value with no test behind it, and
the renderer presents it as such. What the graph cannot express goes to NetArchTest
(`enforced_by: arch-test`): only the composition root names an `Infrastructure` type (`NET-003`) —
`Api → Infrastructure` stays allowed because `Program` must register the `DbContext` — a controller
exposes a DTO and never an entity, a repository is `internal`.

**No `migrations-*` axis** — EF Core carries its own migrations, so the Spring axis would have a
single value. The rules, the `DbContext`, the design-time factory and the Testcontainers fixture
live in the option `persistence-ef`, present as soon as a database is chosen, with no `group`
because there is nothing to choose. **The initial migration belongs to the profile**, snapshot
included: it names the reference example's entity. The tool writes files, it never runs `dotnet ef`
— so the matrix runs `dotnet ef migrations has-pending-model-changes` to prove the hand-written
migration matches the model.

**Roles** — a profile tags its projects `kernel` (the one everyone may reference), `host`,
`persistence` and `tests`. That is the only vocabulary an option may aim at, and the way `core/`
places a file without knowing the layers. Three contracts are held by naming convention, never by a
cross-reference: the profile calls `AddApiSecurity` / `UseApiSecurity`, always supplied by the three
`security-*` options — including `security-none`, whose version does nothing — and `AddPersistence`,
supplied by the persistence option as soon as there is a database.

**`enforced_by` values**: `compiler`, `arch-test`, `analyzer`, `format`, `ef-migrations`,
`nuget-audit`, `commitlint`, `gitleaks`, `none`. **Skills**: the six of the Spring pack
(`architecture`, `db`, `api`, `testing`, `workflow`, `security`) — the symmetry is real.

**Testing** — one test project, three folders separated by `[Trait("Category", …)]`: `Unit` (xUnit
alone), `Slice` (`WebApplicationFactory` with the application layer doubled), `Integration`
(`WebApplicationFactory` + Testcontainers on the real database). `--filter Category!=Integration`
is what separates the levels that need Docker. The .NET counterpart of the H2 ban is the ban on the
`InMemory` provider and on SQLite-in-memory for testing SQL (`CORE-021`).

**Reference example** — the `Notes` feature, mirroring the Spring and React ones: entity →
migration → repository → service → controller, paginated listing, validated creation; one test per
level. On a `record`, the validation attributes are carried by the constructor parameter —
`[property: Required]` is silently ignored and MVC throws on the first call; the skeleton documents
it where it matters.

**Questionnaire** — name · root namespace (PascalCase segments, the role `base_package` plays on
Spring) · description · database [PostgreSQL] / SQL Server / none · profile · security [none] /
cookie / jwt-bearer (+ OIDC authority, which goes to `.env.example`) · Docker · CI · git author ·
trailer · languages · summary. Not asked: the .NET version, the test frameworks, the migration tool.

```yaml
scaffold_version: 1.2.0
project: { name: pay-flow, root_namespace: Solumada.PayFlow, description: ... }
stack: { target: aspnet, database: postgresql }
profile: layered
renderer: claude-code
options: { security: none, docker: true, ci: github }
git: { author: { name: ..., email: ... }, agent_trailer: true }
language: { comments: fr, docs: fr }
```

---

## 13. The `fastapi` pack (fixed — rationale in ADR 0011)

One profile for v1. **`layered`**: a single installable package under `src/{{packageName}}/`, split
into four sub-packages — `domain` (imports nothing) → `repository` (→ `domain`) → `service`
(→ `repository`, `domain`) → `api` (→ `service`, `domain`). Pinned by the tool, never asked: Python
3.13, `uv`, `ruff`, `mypy`, SQLAlchemy 2.0 async with Alembic, `pytest` with Testcontainers.

**Nothing is held by a compiler.** Python has none, so `enforced_by: compiler` has no analogue and
the pack is the opposite pole from `aspnet`. Two substitutes, and the renderer's legend must state
the difference honestly: **`import-linter`** holds the layer boundaries through declarative
contracts, and **`mypy --strict`** takes the compiler's place — the first tooled value whose
sanction is a pipeline step rather than a build artefact. A project nobody runs `mypy` on loses the
rule; a .NET project cannot lose its reference graph.

**The contract belongs to the profile**, in a dedicated `.importlinter`, not in the core's
`pyproject.toml`: a rule's evidence is searched in the templates of the source that carries it. The
`architecture.layers` block feeds the `layers` contract directly — the same status
`layeredArchitecture()` has on Spring, and the only place the layer order is written twice. Two
consequences the ADR did not foresee: `include_external_packages = True` is mandatory (without it
import-linter refuses to check any contract forbidding an external package), and PY-005 needs
`allow_indirect_imports` because PY-003 lets `domain` carry its SQLAlchemy mapping.

**The composition root is three modules** — `app.py` assembles the framework, `routes.py` mounts and
wires, `dependencies.py` supplies. It is the counterpart of `Program` and the `Add*` methods on
.NET, and it is why PY-002 is a test rather than a contract: the root must name the repository to
wire the session.

**No `migrations-*` axis** — Alembic is the only tool. The rules, the session, the engine factory
and the Testcontainers fixture live in the option `persistence-sqlalchemy`, present as soon as a
database is chosen, with no `group`. **The initial migration belongs to the profile**, because it
names the reference example's entity. `alembic check` needs a live database, unlike its EF Core
counterpart, so the drift check is an integration-level test on the Testcontainers database.

**`enforced_by` values**: `import-linter`, `mypy`, `ruff`, `format`, `alembic`, `pip-audit`,
`pytest`, `commitlint`, `gitleaks`, `none`. **Skills**: the six of the Spring and ASP.NET packs.
`testBackedEnforcers` holds two values, `import-linter` and `pytest`, and `carriesRuleEvidence`
accepts `.importlinter` as readily as `tests/` — a named contract is evidence just like a test.

**Testing** — three directories under `tests/`, separated by a pytest marker: `unit` (no
application), `slice` (`httpx.ASGITransport`, service layer doubled), `integration` (`httpx` +
Testcontainers). `pytest -m "not integration"` is what runs without Docker. The Python counterpart
of the H2 ban is the ban on SQLite for testing SQL (`CORE-021`). Each level is a package: two
`conftest.py` outside a package share a module name and mypy then refuses to analyse the project.

**Reference example** — the `notes` feature, mirroring the three others: entity → repository →
service → router, paginated listing, validated creation; one test per level. RFC 9457 is skeleton
code, not configuration: FastAPI ships nothing of the sort and answers 422 in a shape of its own.

**Questionnaire** — name · package name (`snake_case`) · description · database [PostgreSQL] /
MySQL / none · security [none] / session / oauth2-resource-server (+ OIDC issuer, which goes to
`.env.example`) · Docker · CI · git author · trailer · languages · summary.

```yaml
scaffold_version: 1.2.0
project: { name: pay-flow, package_name: pay_flow, description: ... }
stack: { target: fastapi, database: postgresql }
profile: layered
renderer: claude-code
options: { security: none, docker: true, ci: github }
git: { author: { name: ..., email: ... }, agent_trailer: true }
language: { comments: fr, docs: fr }
```

**Traps written down where they bit.** Eta tracks quotes inside a code block, so a lone apostrophe
in a JS comment opens a string that never closes and the render fails far below. Ruff's `N802`
forbids capitals in a function name, which condemns the "rule id in the test name" convention: a
`per-file-ignores` limited to `tests/` settles it.

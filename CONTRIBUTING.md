# Testing prepwork locally

prepwork generates other projects, so "it runs" is never the question. The question is always
whether the **project it produced** still compiles, still passes its own architecture rules, and
still behaves when the team edits it afterwards. This file describes how to check that on a
workstation, and says plainly what a workstation cannot check.

Read it in order the first time; afterwards, §1 and §5 are the two you come back to.

---

## 1. The safety net — the tool itself

```sh
pnpm install
pnpm check          # typecheck + lint + content/ consistency + 127 tests   (~40 s)
```

That single command is the gate for every change. Its four parts, runnable on their own when you
want a shorter loop:

| Command              | What it proves                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`     | strict TypeScript, no `any`, module boundaries respected                                                                                    |
| `pnpm lint`          | ESLint over `src/`, `test/` and `scripts/`                                                                                                  |
| `pnpm check:content` | the catalogue: rule ids and prefixes, schemas, no profile ↔ option cross-dependency, and every tooled rule backed by a test or a lint entry |
| `pnpm test`          | engine, renderers, catalogue, questionnaire — compared against the committed golden files                                                   |
| `pnpm test:watch`    | the same, in a loop, while you edit                                                                                                         |

**The golden files are the alarm, not a formality.** `test/engine/golden/` holds 11 fully rendered
projects (5 Spring Boot, 3 React, 3 ASP.NET Core) and `test/renderers/golden/` two renderer
outputs. If one of them changes while you were only adding content, the core changed behaviour —
find out why before regenerating anything.

Two more, needed only when you touch the schemas or the README pictures:

```sh
pnpm schemas   # regenerates schema/*.schema.json from the Zod schemas — never hand-write those
pnpm shots     # regenerates docs/img/*.svg by replaying init, check and sync for real
```

---

## 2. Running the CLI from the sources

```sh
pnpm dev init out                        # interactive questionnaire (spring-boot by default)
pnpm dev init out --stack react          # the questionnaire of another pack (react, aspnet)
pnpm dev init out --renderer agents-md   # one AGENTS.md instead of CLAUDE.md + .claude/skills/
pnpm dev init out --scaffold s.yaml      # no questionnaire: reproducible, what CI uses
pnpm dev check out                       # computes the plan, writes nothing, exits 1 when out of date
pnpm dev sync out --dry-run              # what sync would do
```

`out/` is already git-ignored: generate there rather than in a temporary directory you will forget.
To exercise the tool the way a user installs it:

```sh
pnpm build && npm link   # the command is then simply `prepwork`
```

## 3. Sweeping combinations without answering questions

```sh
pnpm render out                                              # default scaffold (layered, PostgreSQL, Flyway)
pnpm render out my-scaffold.yaml                             # any scaffold you wrote
pnpm matrix spring-boot out layered session flyway postgresql
pnpm matrix react out spa-feature tanstack-query rhf oidc-bff
pnpm matrix aspnet out layered jwt-bearer sqlserver
```

`pnpm matrix` is exactly what CI runs, so a combination that fails locally fails there too — and
the reverse is what §5 is about.

---

## 4. Verifying a generated project with its own toolchain

This is the part that actually proves something. Generate, then, inside the generated directory:

```sh
# Spring Boot — the Maven wrapper downloads Maven itself, `mvn` need not be installed
./mvnw -B verify

# React — nothing beyond Node and pnpm
cp .env.example .env
pnpm install --no-frozen-lockfile   # a fresh project has no lockfile yet; versions are exact in package.json
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# ASP.NET Core — the SDK version comes from the generated global.json
dotnet restore && dotnet build && dotnet test
```

If the .NET SDK is not on the `PATH` (a local install under `~/.dotnet`, for instance), export
`DOTNET_ROOT` and add both `~/.dotnet` and `~/.dotnet/tools` to the `PATH`, otherwise `dotnet ef`
fails to resolve `hostfxr`.

### Without Docker

The slice and integration levels run on the real database through Testcontainers, so **without a
Docker daemon they cannot run at all** — locally they are not slow, they are absent:

```sh
./mvnw -B verify -DskipITs -Dtest='!NoteRepositoryTest,!NoteIT' -DfailIfNoSpecifiedTests=false
dotnet test --filter "Category!=Integration"
```

Two traps worth knowing:

- `-Dtest` **overrides** the surefire includes, so `NoteIT` has to be named in the exclusion too;
  otherwise surefire runs it instead of failsafe and it fails for the same missing Docker.
- Everything else does pass — compilation, formatting, ArchUnit/NetArchTest, unit and web-slice
  tests, packaging. Do not read that green as a full verification, and do not report it as one.

**The trick to get a complete local run:** generate a variant with `database: none`. There is no
Testcontainers anywhere in it, so a plain `./mvnw -B verify` goes green end to end, failsafe
included — the reference example then uses an in-memory repository. It does not replace the CI run,
but it does tell you whether the templates still hold together.

---

## 5. The round trip — the test that matters

Generating is the easy half. What the tool promises is that it can come back to a project the team
has been living in for weeks without destroying anything. Walk through this after any change to the
engine, the renderers or a pack:

1. **Generate.** `pnpm dev init out --scaffold s.yaml`, then check the ownership split: everything
   listed in `out/.scaffold/manifest.json` belongs to prepwork; the ADRs, the glossary, the README,
   `.env.example` and `scaffold.yaml` belong to the team and must _not_ be in it.
2. **Verify the skeleton** with its own toolchain (§4). A template that no longer compiles is the
   most common regression.
3. **Live in the project.** Edit a generated file by hand — say append a comment to a service — and
   change one answer in `out/scaffold.yaml`, for instance `security: session` → `security: none`.
4. **`pnpm dev check out`.** Expected: a plan that creates, updates and deletes what the new answer
   implies, reports your hand-edited file as `modified by team`, and exits 1. Nothing written.
5. **`pnpm dev sync out`.** Expected: the safe operations applied, your file reported once more and
   **left untouched**. Confirm it by reading the file back.
6. **Rebuild.** The project must still be green after the switch — a new architecture test appears
   with `security: none`, for example.

`pnpm shots` replays steps 1, 4 and 5 for real to produce the README pictures, so running it is a
condensed version of this walkthrough — and a picture that changes is a behaviour that changed.

---

## 6. What a workstation cannot check

| Not checkable locally                                     | Where it is checked                                    |
| --------------------------------------------------------- | ------------------------------------------------------ |
| Every Testcontainers level, with no Docker daemon         | the CI matrices                                        |
| The 42 combinations of the three packs                    | the CI matrices                                        |
| That the generated `global.json` names an installable SDK | the `aspnet` matrix                                    |
| That the shipped EF migration matches the model           | `dotnet ef migrations has-pending-model-changes` in CI |

The matrices run **on pull requests and on manual `workflow_dispatch`, never on a push to `main`**.
So a change to `content/`, to a template or to a pack goes through a branch and a pull request:
landing it straight on `main` means it was never verified beyond what §1 covers. A
documentation-only change may go straight to `main`.

Before opening the pull request: `pnpm check` and `pnpm format:check` green, one coherent change per
commit, conventional commit messages.

---

## 7. Known limits of the local setup

- **The interactive questionnaire needs a real terminal.** `@clack/prompts` reads raw keypresses; a
  piped `stdin` gets through the free-text questions and then dies. Scripted runs use `--scaffold`,
  and the questionnaire itself is covered by unit tests with a scripted prompter.
- **A generated project's `pre-commit` hook requires gitleaks.** Without it, no commit is possible
  inside the generated repository — which is the point, but it surprises the first time.
- **The first `./mvnw` and the first `pnpm install` of a generated project are slow** (cold caches).
  Later runs are much faster; CI pays that cost on every fresh runner.

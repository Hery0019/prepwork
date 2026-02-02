# note-board

Interface rendue sur le serveur

Application React générée par prepwork 0.1.0. Les conventions destinées à l'agent sont dans `CLAUDE.md` et `.claude/skills/` ; ce README s'adresse aux humains et appartient à l'équipe.

## Prérequis

- Node 22 et pnpm (`corepack enable pnpm`)
- gitleaks : le hook `pre-commit` refuse tout commit tant qu'il n'est pas installé (https://github.com/gitleaks/gitleaks#installing)
- Docker, pour construire l'image de production

## Démarrer

```sh
cp .env.example .env
git config core.hooksPath .githooks
pnpm install
pnpm dev
```

Commiter `pnpm-lock.yaml` juste après la première installation : les versions sont épinglées dans `package.json`, et la CI installe en mode figé (`--frozen-lockfile`).

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `pnpm build` | `tsc --noEmit && next build` |
| `pnpm dev` | `next dev` |
| `pnpm format` | `prettier --write .` |
| `pnpm lint` | `eslint . && stylelint "src/**/*.css" && depcruise src` |
| `pnpm preview` | `next start` |
| `pnpm test` | `vitest run` |
| `pnpm typecheck` | `tsc --noEmit` |

## Structure

| Chemin | Rôle |
|---|---|
| `src/app` | couche `app` — dépend de features, entities, shared |
| `src/features/*` | couche `features` — dépend de entities, shared |
| `src/entities/*` | couche `entities` — dépend de shared |
| `src/shared` | couche `shared` — ne dépend de rien |
| `src/shared/styles/tokens.css` | Contrat visuel, généré depuis le preset |
| `src/shared/styles/tokens.override.css` | Surcharges de la marque — appartient à l'équipe |
| `src/shared/ui/` | Kit d'interface copié dans le dépôt — appartient à l'équipe |
| `docs/adr/` | Décisions d'architecture — appartient à l'équipe |
| `.scaffold/manifest.json` | Fichiers générés et leurs empreintes |

## Mettre à jour les fichiers générés

Modifier `scaffold.yaml`, puis lancer `prepwork sync`. Un fichier généré que l'équipe a modifié est signalé, jamais écrasé.

# pay-flow

Flux de paiement

Projet ASP.NET Core généré par prepwork 0.1.0. Les conventions destinées à l'agent sont dans `CLAUDE.md` et `.claude/skills/` ; ce README s'adresse aux humains et appartient à l'équipe.

## Prérequis

- SDK .NET 10.0.400 ou plus récent dans la même bande (voir `global.json`)
- Docker (Testcontainers pour les tests d'intégration)
- gitleaks : le hook `pre-commit` refuse tout commit tant qu'il n'est pas installé (https://github.com/gitleaks/gitleaks#installing)

## Démarrer

```sh
cp .env.example .env            # puis adapter les valeurs
git config core.hooksPath .githooks
dotnet test                     # compile, les trois niveaux, les règles d'architecture
dotnet run --project src/Solumada.PayFlow.Api
```

L'API est exposée sous `/api/v1/` ; `GET /health` répond dès le démarrage et `GET /openapi/v1.json` sert le document OpenAPI en développement.

Sans Docker : `dotnet test --filter Category!=Integration` lance toute la suite qui n'a pas besoin de conteneur.

## Structure

| Chemin | Rôle |
|---|---|
| `scaffold.yaml` | Choix du projet ; seule entrée de `prepwork sync` et `prepwork check` |
| `CLAUDE.md`, `.claude/skills/` | Conventions pour l'agent (générées) |
| `docs/adr/` | Décisions d'architecture (à l'équipe) |
| `docs/glossary.md` | Vocabulaire métier (à l'équipe) |
| `.scaffold/manifest.json` | Liste des fichiers générés et leurs empreintes |
| `src/Solumada.PayFlow.Domain/` | Projet `domain` |
| `src/Solumada.PayFlow.Application/` | Projet `application` |
| `src/Solumada.PayFlow.Infrastructure/` | Projet `infrastructure` |
| `src/Solumada.PayFlow.Api/` | Projet `api` |
| `tests/Solumada.PayFlow.Tests/` | Projet `tests` |

## Mettre à jour les fichiers générés

Modifier `scaffold.yaml`, puis lancer `prepwork sync`. Un fichier généré que l'équipe a modifié est signalé, jamais écrasé.

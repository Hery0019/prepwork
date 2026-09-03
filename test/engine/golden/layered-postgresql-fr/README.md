# pay-flow

Payment flows

Projet Spring Boot généré par prepwork 0.1.0. Les conventions destinées à l'agent sont dans `CLAUDE.md` et `.claude/skills/` ; ce README s'adresse aux humains et appartient à l'équipe.

## Prérequis

- JDK 21
- Docker (Testcontainers pour les tests slice et d'intégration)
- Maven est fourni par le wrapper (`./mvnw`, `mvnw.cmd`)
- gitleaks : le hook `pre-commit` refuse tout commit tant qu'il n'est pas installé (https://github.com/gitleaks/gitleaks#installing)

## Démarrer

```sh
cp .env.example .env            # puis adapter les valeurs
git config core.hooksPath .githooks
./mvnw verify                   # compile, tests, règles ArchUnit
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

L'API est exposée sous `/api/v1/` ; `GET /actuator/health` répond dès le démarrage.

## Structure

| Chemin | Rôle |
|---|---|
| `scaffold.yaml` | Choix du projet ; seule entrée de `prepwork sync` et `prepwork check` |
| `CLAUDE.md`, `.claude/skills/` | Conventions pour l'agent (générées) |
| `docs/adr/` | Décisions d'architecture (à l'équipe) |
| `docs/glossary.md` | Vocabulaire métier (à l'équipe) |
| `.scaffold/manifest.json` | Liste des fichiers générés et leurs empreintes |
| `src/` | Squelette du profil `layered`, exemple de référence et tests |

## Mettre à jour les fichiers générés

Modifier `scaffold.yaml`, puis lancer `prepwork sync`. Un fichier généré que l'équipe a modifié est signalé, jamais écrasé.

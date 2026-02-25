# ADR 0003 — Base de données et migrations

Date : 2026-09-03 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork. L'outil de migration n'est pas un choix : EF Core embarque le sien. Le schéma n'évolue que par migration, et les tests tournent sur le vrai moteur via Testcontainers, jamais sur le provider `InMemory` (CORE-021).

## Décision

- Moteur : **sqlserver**
- Migrations : **EF Core**, dans le projet `BackOffice.Infrastructure`
- L'application n'applique jamais les migrations au démarrage : elles sont appliquées explicitement (`dotnet ef database update`, une étape de déploiement, ou la fixture de test).

## Conséquences

Toute modification de schéma est une migration commitée avec le code qui l'utilise ; supprimer une migration est interdit à l'agent (CORE-007).

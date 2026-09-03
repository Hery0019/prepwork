# ADR 0002 — Version de .NET

Date : 2026-09-03 · Statut : acceptée

## Contexte

La version du SDK n'est pas demandée au questionnaire : elle est épinglée par la version de prepwork, comme le sont les versions des paquets.

## Décision

**.NET 10 (LTS)**, cible `net10.0`, SDK `10.0.400` déclaré dans `global.json` avec `rollForward: latestFeature`.

`rollForward` accepte un SDK plus récent de la même bande majeure : une machine à jour compile, une machine en retard échoue avec un message clair plutôt qu'avec une erreur de compilation obscure.

## Conséquences

`TargetFramework` est fixé une seule fois dans `Directory.Build.props` ; le Dockerfile et la CI utilisent la même version. Changer de version majeure est une migration, avec son propre ADR.

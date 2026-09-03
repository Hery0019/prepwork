# ADR 0004 — Authentification

Date : 2026-09-03 · Statut : accepté

## Décision

`oidc-bff`

## Conséquences

Ce qui part dans le bundle est public : aucun secret n'y entre (CORE-070). Le contrôle d'accès appartient à l'API ; masquer une route dans le client est un confort, pas une protection.

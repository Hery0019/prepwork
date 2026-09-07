# ADR 0004 — Sécurité

Date : 2026-09-09 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier.

## Décision

**oauth2-resource-server**

## Conséquences

Le contrat `configure_security` est appelé par la racine de composition quelle que soit l'option, y compris `none` dont la version ne fait rien. Changer d'option est un changement de `scaffold.yaml`, pas un montage à la main.

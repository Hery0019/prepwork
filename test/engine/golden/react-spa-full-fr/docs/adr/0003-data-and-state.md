# ADR 0003 — Données et état

Date : 2026-09-03 · Statut : accepté

## Décision

- Données serveur : `tanstack-query`
- Formulaires : `rhf`
- État client : `zustand`

## Conséquences

Tout appel réseau passe par le module api/ d'une feature et sa réponse est validée par un schéma zod (CORE-040, CORE-041). L'état serveur et l'état client ne se mélangent pas.

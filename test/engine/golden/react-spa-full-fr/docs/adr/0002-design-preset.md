# ADR 0002 — Contrat visuel

Date : 2026-09-03 · Statut : accepté

## Contexte

Sans contrat visuel écrit, chaque écran invente sa typographie, ses espacements et ses couleurs.

## Décision

Preset `app-sober`, avec thème sombre.

- Typographie : 'Inter', system-ui, sans-serif / 'Inter', system-ui, sans-serif
- Échelle : 1.200 · graisses 400, 500, 600, 700
- Espacement de base : 4px · rayon 8px

## Conséquences

Les valeurs vivent dans src/shared/styles/tokens.css, qui appartient à l'équipe : c'est là qu'on adapte la marque. Chaque token devient une classe utilitaire, et Stylelint refuse toute couleur écrite ailleurs.

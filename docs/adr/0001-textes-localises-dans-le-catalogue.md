# ADR 0001 — Textes localisés (en/fr) dans le catalogue

Date : 2026-09-02 · Statut : accepté

## Contexte

Le questionnaire laisse choisir la langue de la documentation générée (`language.docs`, `fr` par
défaut). Les règles du catalogue sont des phrases atomiques ; le renderer ne peut pas les traduire.

## Décision

Tout texte destiné au lecteur (`statement`, `rationale`, `instead`, `summary`, `purpose`…) est un
`LocalizedText` : soit une chaîne nue (anglais), soit un objet `{ en, fr }`. Le renderer choisit la
variante de `language.docs` ; l'anglais est la langue de repli. Chaque variante reste une seule ligne :
la validation Zod refuse les paragraphes.

## Conséquences

- Le contenu livré est rédigé dans les deux langues ; c'est le prix d'une documentation lisible par
  l'équipe.
- Ajouter une langue = étendre `LanguageSchema` et le type `LocalizedText`, sans toucher au moteur.

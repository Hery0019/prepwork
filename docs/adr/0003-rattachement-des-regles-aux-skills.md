# ADR 0003 — Rattachement des règles aux skills

Date : 2026-09-02 · Statut : accepté

## Contexte

La sortie `claude-code` produit six skills fixes : `architecture`, `db`, `api`, `testing`, `workflow`,
`security`. Chaque règle doit apparaître dans exactement un skill, quelle que soit sa source.

## Décision

- `core/<id>.yaml` porte un champ `skill` : toutes ses règles vont dans ce skill.
- `option.yaml` porte un champ `skill` : idem (ex. `migrations-*` → `db`, `docker` → `workflow`).
- `profile.yaml` couvre plusieurs skills : son bloc `skills` liste les ids de règles et d'anti-patterns
  par skill. Le schéma Zod vérifie que chaque id du profil est rattaché exactement une fois et qu'aucun
  id étranger n'y figure.

## Conséquences

Le renderer n'a aucune table de correspondance à maintenir : il itère sur les skills et collecte les
règles de chaque source. Un skill peut être vide pour une source donnée.

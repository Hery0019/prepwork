# ADR 0004 — `files.yaml`, conditions `when` et fichiers `team`

Date : 2026-09-02 · Statut : accepté

## Contexte

Chaque source (core, profil, option) génère des fichiers. Certains dépendent de la stack (`database`,
`java`) ou d'une valeur de scaffold ; d'autres appartiennent à l'équipe dès leur création (ADR,
glossaire, `.env.example`).

## Décision

Chaque source déclare ses fichiers dans `files.yaml` : `source` (template Eta sous `templates/`),
`target` (chemin cible, expressions Eta autorisées), `when` (condition optionnelle), `owner`
(`generated` par défaut, ou `team`).

`when` est un mini-langage volontairement minuscule (`stack.database != 'none' && options.docker`,
`!`, parenthèses). Un chemin inconnu est une erreur, jamais un `false` silencieux. Il permet à la
vérification de contenu de refuser mécaniquement une condition sur `options.*` dans un profil ou sur
`profile` dans une option (orthogonalité, CLAUDE.md §2). La même vérification scanne les templates :
`it.options`/`it.optionIds` interdits dans un profil, `it.profile` interdit dans une option.

`owner: team` : le fichier est créé s'il est absent, puis n'est plus jamais touché ni listé dans le
manifeste. C'est le cas des ADR, du glossaire et de `.env.example` (qui reçoit à l'init des valeurs
saisies dans le questionnaire, comme l'URL de l'issuer OAuth2, absentes de `scaffold.yaml`).

---
name: "a11y"
description: "Rôles, libellés, clavier, contraste et mouvement. À lire avant de toucher au balisage."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Accessibilité

L'accessibilité se décide au moment du balisage : rattrapée après coup, elle coûte dix fois plus cher.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-030** · `jsx-a11y` — L'élément natif passe en premier (`button`, `a`, `input`, `dialog`) ; un `role` n'est ajouté que si aucun élément natif ne convient.
  Pourquoi : Les éléments natifs apportent gratuitement le clavier, le focus et la sémantique.
- **CORE-031** · `jsx-a11y` — Tout champ de formulaire a un libellé visible associé par `htmlFor` et `id`.
  Pourquoi : Un placeholder n'est pas un libellé ; il disparaît dès que l'utilisateur saisit.
- **CORE-032** · `jsx-a11y` — Toute image porte un `alt` ; une image décorative porte `alt=""`.
  Pourquoi : Un `alt` manquant fait annoncer le nom du fichier par un lecteur d'écran.
- **CORE-033** · guidance — Le texte garde un contraste d'au moins 4,5:1 avec son fond, 3:1 pour un texte de 24px ou plus gras.
  Pourquoi : En dessous, l'écran devient illisible en extérieur et pour une grande partie des utilisateurs.
- **CORE-034** · guidance — Une cible interactive mesure au moins 44 sur 44 pixels, marge intérieure comprise.
  Pourquoi : En dessous, un écran tactile transforme chaque appui en loterie.
- **CORE-035** · `jsx-a11y` — Aucun `tabIndex` positif ; l'ordre de focus suit l'ordre du DOM.
  Pourquoi : Un ordre de focus fait à la main casse dès le premier élément inséré.
- **CORE-036** · `stylelint` — Animations et transitions sont neutralisées sous `prefers-reduced-motion: reduce`.
  Pourquoi : Le mouvement provoque une gêne réelle chez une partie des utilisateurs ; la préférence leur appartient.
- **CORE-037** · guidance — Un message d'état ou d'erreur est annoncé par `role="alert"` ou une région `aria-live`, jamais par la couleur seule.
  Pourquoi : Un utilisateur qui ne voit pas la couleur doit tout de même recevoir l'information.
- **CORE-038** · guidance — Une modale piège le focus tant qu'elle est ouverte et le rend à l'élément qui l'a ouverte à la fermeture.
  Pourquoi : Sans cela, un utilisateur au clavier se retrouve à naviguer dans la page derrière la boîte de dialogue.

### Anti-patterns

- **CORE-AP-030** · guidance — Signaler un champ invalide par une bordure rouge seulement.
  Pourquoi : L'information est invisible pour un daltonien et pour un lecteur d'écran.
  À la place : Ajouter un message texte relié au champ et annoncé dans une région live.

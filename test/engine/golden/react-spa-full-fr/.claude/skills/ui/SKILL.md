---
name: "ui"
description: "Tokens, typographie, variantes et états obligatoires d'un composant. À lire avant d'écrire du JSX ou une classe."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Composants et style

Le style passe par les tokens du projet, jamais par des valeurs écrites à la main. Un composant qui n'a pas ses cinq états n'est pas fini.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-010** · guidance — Un composant qui peut être en chargement, vide ou en erreur rend un état explicite pour chacun des trois, et ne retourne jamais `null` à la place.
  Pourquoi : Ce sont les trois états qu'un agent laissé libre oublie ; un écran blanc est le bug le plus coûteux à diagnostiquer.
- **CORE-011** · guidance — Tout composant interactif gère l'état désactivé et montre un anneau `:focus-visible` visible.
  Pourquoi : Avec chargement, vide et erreur, ce sont les cinq états qui rendent un composant fini.
- **CORE-012** · guidance — Un composant de présentation reçoit ses données par ses props et n'appelle jamais lui-même le réseau ni un hook de requête.
  Pourquoi : Un composant qui va chercher ses données ne peut être ni réutilisé, ni prévisualisé, ni testé sans serveur.
- **CORE-013** · guidance — Un fichier exporte un composant ; ses variantes vivent dans le même fichier via `cva`, jamais dans des fichiers copiés.
  Pourquoi : Une variante copiée diverge de l'original dès le premier changement.
- **CORE-014** · `typescript` — Les props sont typées explicitement et `any` n'apparaît jamais, ni dans un composant ni dans un hook.
  Pourquoi : Le type des props est le contrat que les autres développeurs et l'agent lisent en premier.
- **CORE-015** · `eslint` — Une liste rend une clé métier stable, jamais l'index du tableau.
  Pourquoi : Une clé d'index corrompt l'état local dès que la liste est triée ou filtrée.
- **CORE-016** · guidance — Une logique métier plus longue qu'un ternaire vit dans un hook ou une fonction simple, jamais dans le JSX.
  Pourquoi : Le JSX décrit ce qui est affiché ; une logique qui s'y cache est intestable.
- **CORE-017** · guidance — `useEffect` ne sert qu'à se synchroniser avec quelque chose d'extérieur à React ; tout ce qui est dérivable est calculé au rendu.
  Pourquoi : Les effets qui recalculent un état sont la première source de rendus superflus et de valeurs périmées.
- **CORE-020** · `stylelint` — Couleurs, espacements, rayons et tailles de texte viennent des tokens du projet ; aucune valeur hex, rgb ou px brute n'apparaît dans un composant.
  Pourquoi : Une valeur écrite à la main échappe au thème, au mode sombre et à tout changement de marque ultérieur.
- **CORE-021** · `eslint` — Les valeurs arbitraires de Tailwind (`p-[13px]`, `text-[#3a5bd9]`) sont interdites.
  Pourquoi : C'est la même valeur écrite à la main, cachée dans un nom de classe.
- **CORE-022** · `stylelint` — Les couleurs sont utilisées par leur token sémantique (`--color-surface`, `--color-destructive`), jamais par une nuance de palette.
  Pourquoi : Un nom sémantique survit à un changement de palette ; `blue-600` non.
- **CORE-023** · guidance — Le thème sombre redéfinit les mêmes tokens ; aucun composant ne teste le thème actif.
  Pourquoi : Un composant qui connaît le thème doit être modifié deux fois à chaque changement visuel.
- **CORE-024** · `stylelint` — Les espacements utilisent l'échelle construite sur le pas de base ; aucune valeur intermédiaire n'est introduite.
  Pourquoi : Un rythme unique est ce qui fait ressembler à un seul produit des écrans écrits par des mains différentes.
- **CORE-025** · `stylelint` — Les tailles de texte viennent des tokens de l'échelle modulaire, et seules les graisses listées dans le contrat visuel sont utilisées.
  Pourquoi : Deux tailles et une graisse de plus suffisent à rendre une typographie accidentelle.
- **CORE-026** · `stylelint` — `!important` n'apparaît jamais dans les feuilles de style du projet.
  Pourquoi : C'est le signe d'un problème de spécificité que le développeur suivant devra résoudre deux fois.
- **CORE-027** · guidance — Un nouveau token est ajouté au fichier de tokens et aux deux thèmes dans le même changement, jamais en ligne dans un composant.
  Pourquoi : Le fichier de tokens est le seul inventaire lisible du langage visuel.

### Anti-patterns

- **CORE-AP-010** · guidance — Retourner `null` pendant le chargement, laissant l'utilisateur devant une zone vide.
  Pourquoi : L'utilisateur ne peut pas distinguer un écran lent d'un écran cassé.
  À la place : Rendre le squelette ou le spinner du design system, dimensionné comme le contenu final.
- **CORE-AP-011** · `jsx-a11y` — Un `<div onClick>` utilisé comme bouton.
  Pourquoi : Il est inatteignable au clavier et invisible pour les technologies d'assistance.
  À la place : Utiliser un `<button>`, stylé avec les tokens du design system.
- **CORE-AP-020** · `stylelint` — Une couleur relevée sur une maquette et collée dans une classe pour un seul écran.
  Pourquoi : Elle marche aujourd'hui et casse le thème sombre, le contrôle de contraste et la refonte suivante.
  À la place : Réutiliser le token sémantique le plus proche, ou en ajouter un au fichier de tokens si le sens est nouveau.

## Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

### Contrat visuel

| Token | Valeur |
|---|---|
| Typographie | 'Inter', system-ui, sans-serif · 'Inter', system-ui, sans-serif · 'JetBrains Mono', ui-monospace, monospace |
| Échelle modulaire | 1.200 |
| Graisses autorisées | 400, 500, 600, 700 |
| Longueur de ligne | 70ch |
| Pas d'espacement | 4px |
| Rayon | 8px |

**Couleurs sémantiques**

| Token | Clair | Sombre |
|---|---|---|
| `--color-background` | `#ffffff` | `#101319` |
| `--color-surface` | `#f6f7f9` | `#181c24` |
| `--color-text` | `#101828` | `#e8eaee` |
| `--color-muted` | `#5a6472` | `#a2abb8` |
| `--color-border` | `#d6dae0` | `#2b323d` |
| `--color-primary` | `#3a5bd9` | `#8fa6f5` |
| `--color-primary-foreground` | `#ffffff` | `#101319` |
| `--color-destructive` | `#b3261e` | `#f2a49e` |
| `--color-success` | `#1c6b3f` | `#7fd0a3` |

### Règles

- **SPA-010** · guidance — Un composant utilisé par deux features remonte dans `shared/ui` dans son propre commit, débarrassé du vocabulaire métier.
  Pourquoi : Promouvoir un composant est une décision ; le copier est la façon dont meurt un design system.

## Option `i18n`

Le texte visible passe par des fichiers de traduction, un espace de noms par feature.

### Règles

- **INTL-001** · `eslint` — Aucune chaîne visible n'est écrite dans le JSX ; tout texte passe par la fonction de traduction.
  Pourquoi : Une seule chaîne en dur suffit à rendre un écran intraduisible.
- **INTL-002** · guidance — Les clés portent l'espace de noms de leur feature et sont écrites en entier ; une clé n'est jamais construite par concaténation.
  Pourquoi : Une clé concaténée ne se retrouve ni par recherche, ni comme manquante.
- **INTL-003** · guidance — Dates, nombres et pluriels sont formatés par `Intl` ou les fonctions de la bibliothèque, jamais à la main.
  Pourquoi : Un formatage fait à la main est juste dans une langue et faux dans la suivante.

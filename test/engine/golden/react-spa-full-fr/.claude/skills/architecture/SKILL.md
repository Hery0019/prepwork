---
name: "architecture"
description: "Couches, frontières entre features, index publics et exemple de référence. À lire avant de créer un fichier ou un dossier."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Architecture

Le profil dicte les couches et le sens des imports. Un fichier qui ne trouve pas sa couche est un signal : s'arrêter et demander.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

### Quand ce profil convient

- L'interface parle à une API HTTP déjà là ou construite en parallèle.
- L'équipe est assez petite pour un seul dépôt et une seule unité de déploiement.
- Les écrans se composent de quelques cas d'usage indépendants.

### Quand il ne convient pas

- Le produit a besoin de rendu serveur ou de streaming pour le référencement ou le premier affichage.
- Plusieurs équipes possèdent des parties distinctes de la même interface et déploient séparément.
- L'application est surtout du contenu statique avec peu d'interaction.

### Couches

| Couche | Chemin | Peut dépendre de |
|---|---|---|
| `app` | `src/app` | `features`, `entities`, `shared` |
| `features` | `src/features/*` | `entities`, `shared` |
| `entities` | `src/entities/*` | `shared` |
| `shared` | `src/shared` | rien |

### Règles

- **SPA-001** · `eslint-boundaries` — Chaque cas d'usage est un dossier sous `src/features/` qui porte `ui/`, `model/`, `api/` et un `index.ts` qui est son seul point d'entrée public.
  Pourquoi : Une feature qui se lit, se déplace ou se supprime seule est ce qui garde compréhensible une interface qui grossit.
- **SPA-002** · `eslint-boundaries` — Une feature n'importe jamais une autre feature ; deux features se composent dans `app/`.
  Pourquoi : Les imports croisés entre features sont la façon dont une interface modulaire devient un bloc en silence.
- **SPA-003** · `eslint-boundaries` — Seul l'index public d'une couche est importé ; atteindre un fichier interne d'une feature est interdit.
  Pourquoi : Sans surface publique, chaque renommage interne devient un changement cassant pour toute l'application.
- **SPA-004** · `eslint-boundaries` — `shared/` ne contient rien qui nomme le domaine métier : aucun type d'entité, aucun nom de feature, aucun endpoint.
  Pourquoi : Le jour où le vocabulaire métier entre dans `shared/`, tout dépend de nouveau de tout.
- **SPA-005** · guidance — Une entité sous `src/entities/` porte la forme d'un objet du domaine, son schéma zod et ses composants d'affichage, et aucun cas d'usage.
  Pourquoi : Deux features qui affichent le même objet doivent le montrer de la même façon sans dépendre l'une de l'autre.
- **SPA-006** · `eslint-boundaries` — Une feature n'importe jamais depuis `app/` ; la composition ne circule que dans un sens.
  Pourquoi : L'import inverse est ce qui rend une feature impossible à réutiliser sur un autre écran.
- **SPA-007** · guidance — Les routes sont déclarées dans `src/app`, et chaque route charge sa feature en différé.
  Pourquoi : La carte du routage reste lisible dans un seul fichier et le premier bundle reste petit.
- **SPA-008** · `dependency-cruiser` — Le graphe de dépendances n'a ni cycle ni module orphelin.
  Pourquoi : Un cycle casse le chargement différé et le tree-shaking ; un orphelin est du code mort que personne n'ose supprimer.
- **SPA-012** · `eslint-boundaries` — Une nouvelle feature est créée avec son `index.ts` dès le premier commit ; une feature sans index public n'existe pas pour le reste de l'application.
  Pourquoi : L'index est l'endroit où l'auteur décide de ce qui est public, avant que quiconque dépende du reste.

### Anti-patterns

- **SPA-AP-001** · `eslint-boundaries` — Un dossier `src/utils/` qui collecte tout ce qui ne va nulle part ailleurs.
  Pourquoi : Il devient une dépendance de toutes les couches et n'appartient à aucune.
  À la place : Placer la fonction dans `shared/lib` sous un nom qui dit ce qu'elle fait, ou dans la seule feature qui l'utilise.
- **SPA-AP-002** · `eslint-boundaries` — Importer `../../features/notes/model/useNotes` pour réutiliser un hook.
  Pourquoi : La feature qui importe casse désormais dès que l'autre réorganise son intérieur.
  À la place : Exporter le hook depuis l'index de la feature s'il est public, sinon descendre la logique commune dans `entities/` ou `shared/`.

### Exemple de référence

La feature `notes` : une liste paginée avec ses trois états, un formulaire de création validé et une vue de détail.

Fichiers :

- `src/entities/note/model/note.ts`
- `src/entities/note/ui/NoteCard.tsx`
- `src/features/notes/api/notesApi.ts`
- `src/features/notes/model/useNotes.ts`
- `src/features/notes/ui/NoteList.tsx`
- `src/features/notes/ui/NoteForm.tsx`
- `src/features/notes/index.ts`
- `src/app/routes.tsx`

Règles illustrées : **SPA-001**, **SPA-002**, **SPA-003**, **CORE-010**, **CORE-040**, **CORE-050**, **CORE-060**

### Dépendances

**Autorisées sans discussion**

| Artefact | Rôle |
|---|---|
| `react-router` | Routage et chargement différé des écrans déclarés dans `app/`. |
| `zod` | Validation de tout ce qui entre dans l'application, et inférence des types correspondants. |
| `class-variance-authority` | Variantes d'un composant déclarées à côté de lui, au-dessus des tokens. |
| `@radix-ui/react-*` | Primitives accessibles pour dialogues, menus et popovers, stylées avec les tokens du projet. |

**Interdites**

| Artefact | Raison |
|---|---|
| `moment` | Non maintenu et lourd ; `Intl` et l'API de dates native couvrent le besoin. |
| `lodash` | Toute la bibliothèque pour deux fonctions ; le langage les fournit désormais. |
| `axios` | `fetch` et la couche api donnent déjà des appels typés et la gestion des erreurs. |

**Procédure pour ajouter une dépendance**

1. Vérifier que ni la bibliothèque standard ni une dépendance déjà autorisée ne couvre le besoin.
2. Proposer la dépendance, son rôle et son poids dans le bundle, puis attendre confirmation.
3. L'ajouter dans un commit dédié (`build(deps)`) qui ne touche que `package.json` et le fichier de verrouillage.
4. L'enregistrer dans `docs/adr/` quand elle change la façon d'écrire une couche.

## Option `state-zustand`

L'état client vit dans de petits stores zustand qui exposent des sélecteurs.

### Règles

- **ZUS-001** · guidance — Un store ne porte que de l'état client ; aucune donnée serveur n'y entre.
  Pourquoi : Une donnée serveur dans un store est un second cache que personne n'invalide.
- **ZUS-002** · guidance — Un composant s'abonne par un sélecteur, jamais au store entier.
  Pourquoi : S'abonner à tout re-rend tous les écrans à chaque changement.

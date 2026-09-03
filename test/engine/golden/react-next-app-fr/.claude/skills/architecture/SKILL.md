---
name: "architecture"
description: "Couches, frontières entre features, index publics et exemple de référence. À lire avant de créer un fichier ou un dossier."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Architecture

Le profil dicte les couches et le sens des imports. Un fichier qui ne trouve pas sa couche est un signal : s'arrêter et demander.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `next-app`

Next.js App Router, rendu sur le serveur par défaut, un dossier par cas d'usage.

### Quand ce profil convient

- Le premier affichage ou le référencement comptent, donc le HTML doit arriver complet.
- L'interface a besoin d'un serveur à elle pour tenir des secrets et parler à l'API.
- L'équipe accepte d'exécuter et de déployer un serveur Node à côté des fichiers statiques.

### Quand il ne convient pas

- L'application est servie en fichiers statiques derrière un CDN, sans serveur à elle.
- L'interface vit dans une coquille existante qui gère déjà le routage.
- L'équipe veut un seul modèle mental, sans la frontière serveur/client.

### Couches

| Couche | Chemin | Peut dépendre de |
|---|---|---|
| `app` | `src/app` | `features`, `entities`, `shared` |
| `features` | `src/features/*` | `entities`, `shared` |
| `entities` | `src/entities/*` | `shared` |
| `shared` | `src/shared` | rien |

### Règles

- **NEXT-002** · `eslint-boundaries` — Une route est un dossier sous `src/app/` qui porte `page.tsx`, et la page délègue à une feature au lieu de porter de la logique.
  Pourquoi : La carte des routes reste lisible, et un cas d'usage se lit sans parcourir l'arbre des URL.
- **NEXT-006** · `eslint-boundaries` — Une feature n'importe jamais une autre feature ; deux features se composent dans une page de `src/app`.
  Pourquoi : Les imports croisés entre features sont la façon dont une interface modulaire devient un bloc en silence.
- **NEXT-007** · `eslint-boundaries` — Seul l'index public d'une feature ou d'une entité est importé, jamais un de ses fichiers internes.
  Pourquoi : Sans surface publique, chaque renommage interne devient un changement cassant pour toute l'application.
- **NEXT-008** · `eslint-boundaries` — `shared/` ne contient rien qui nomme le domaine métier, et n'importe jamais une feature.
  Pourquoi : Le jour où le vocabulaire métier entre dans `shared/`, tout dépend de nouveau de tout.
- **NEXT-009** · `dependency-cruiser` — Le graphe de dépendances n'a ni cycle ni module orphelin.
  Pourquoi : Un cycle casse la découpe du bundle ; un orphelin est du code mort que personne n'ose supprimer.
- **NEXT-012** · guidance — Les tests vivent à côté du code qu'ils couvrent, dans la feature, jamais dans un dossier de tests global.
  Pourquoi : Supprimer une feature doit supprimer ses tests avec elle.

### Anti-patterns

- **NEXT-AP-001** · guidance — Ajouter `'use client'` en haut d'une page pour faire disparaître une erreur.
  Pourquoi : Tout le sous-arbre devient du code client, et le rendu serveur est perdu sans que personne le voie.
  À la place : Descendre la frontière jusqu'au plus petit composant qui a réellement besoin du navigateur.

### Exemple de référence

La feature `notes` : une liste rendue sur le serveur avec ses états de chargement et d'erreur, un formulaire piloté par une action serveur, et une page de détail.

Fichiers :

- `src/entities/note/model/note.ts`
- `src/entities/note/ui/NoteCard.tsx`
- `src/features/notes/api/notesApi.ts`
- `src/features/notes/api/actions.ts`
- `src/features/notes/ui/NoteList.tsx`
- `src/features/notes/ui/NoteForm.tsx`
- `src/features/notes/index.ts`
- `src/app/notes/page.tsx`
- `src/app/notes/loading.tsx`
- `src/app/notes/error.tsx`

Règles illustrées : **NEXT-002**, **NEXT-003**, **NEXT-004**, **NEXT-011**, **CORE-010**, **CORE-041**, **CORE-050**

### Dépendances

**Autorisées sans discussion**

| Artefact | Rôle |
|---|---|
| `next` | Routeur, composants serveur, actions serveur et serveur de production. |
| `zod` | Validation de tout ce qui entre dans l'application, et inférence des types correspondants. |
| `class-variance-authority` | Variantes d'un composant déclarées à côté de lui, au-dessus des tokens. |

**Interdites**

| Artefact | Raison |
|---|---|
| `react-router` | Le framework possède le routage ; un second routeur entrerait en conflit avec lui. |
| `axios` | `fetch` est étendu par le framework avec le cache et la revalidation. |
| `moment` | Non maintenu et lourd ; `Intl` et l'API de dates native couvrent le besoin. |

**Procédure pour ajouter une dépendance**

1. Vérifier que ni le framework ni une dépendance déjà autorisée ne couvre le besoin.
2. Dire si la dépendance tourne sur le serveur, dans le navigateur, ou les deux ; une dépendance navigateur se pèse dans le bundle.
3. L'ajouter dans un commit dédié (`build(deps)`) qui ne touche que `package.json` et le fichier de verrouillage.

## Option `state-context`

L'état client est partagé par des contextes React, un par sujet.

### Règles

- **CTX-001** · guidance — Un provider par sujet, déclaré par la feature qui possède l'état, jamais un unique provider global.
  Pourquoi : Un provider global re-rend tout l'arbre et n'appartient à personne.
- **CTX-002** · guidance — Un contexte porte une valeur qui change rarement ; les valeurs qui changent souvent restent en état local.
  Pourquoi : Chaque mise à jour d'un contexte re-rend tous ses consommateurs, quoi qu'ils en utilisent.

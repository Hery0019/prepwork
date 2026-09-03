<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# note-book

Interface de gestion de notes

Ce fichier est le contrat de travail de l'agent pour ce dépôt. Il rassemble les conventions du projet ; chaque règle porte un identifiant stable à citer dans les plans et les revues.

## Projet

|  |  |
|---|---|
| Nom | `note-book` |
| Profil d'architecture | `spa-feature` — Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas. |
| Données | TanStack Query |
| Formulaires | react-hook-form + zod |
| État client | zustand |
| Authentification | OIDC (BFF) |
| i18n | non |
| Tests e2e | oui |
| Docker | oui |
| CI | GitHub Actions |
| Preset visuel | `app-sober` |
| Thème sombre | oui |
| Langues | commentaires en français, documentation en français |

## Comment lire une règle

Chaque règle est une phrase vérifiable, suivie de sa raison. Le marqueur après l'identifiant dit qui la fait respecter :

- `eslint-boundaries`, `dependency-cruiser`, `typescript`, `eslint`, `jsx-a11y`, `stylelint`, `prettier`, `vitest`, `playwright`, `commitlint`, `gitleaks` : contrainte outillée, le build, le lint ou le commit échoue si elle est violée.
- `guidance` : règle de conduite pour l'agent, vérifiée en revue, sans outil derrière.

## Règles permanentes

Ces règles s'appliquent à chaque intervention, quel que soit le fichier touché.

- **CORE-001** — Avant tout changement non trivial (plus d'un fichier, un changement de schéma ou une nouvelle dépendance), l'agent écrit un plan court et attend confirmation.
- **CORE-002** — Une tâche est un changement cohérent et un commit ; refactoring et fonctionnalité ne sont jamais mélangés dans un même commit.
- **CORE-003** — L'agent ne crée jamais de commit `WIP`, `tmp` ou `fix later` ; un changement n'est commité que lorsque ses tests passent.
- **CORE-004** — Les tests sont écrits dans le même changement que le code qu'ils couvrent, jamais dans un commit ultérieur.
- **CORE-005** — Quand la spécification est ambiguë ou contradictoire, l'agent s'arrête et pose la question ; il ne choisit pas l'interprétation la plus probable.
- **CORE-006** — L'ajout d'une dépendance est un commit séparé qui suit la procédure de dépendances du profil.
- **CORE-007** — L'agent n'exécute jamais `git push`, `git reset --hard` ni `git clean`.
- **CORE-080** — Les identifiants du code (fichiers, composants, hooks, props, variables) sont toujours en anglais.
- **CORE-081** — Les commentaires et la documentation sont écrits dans la langue configurée du projet (voir la section réglages du projet).
- **CORE-082** — Un texte affiché à l'utilisateur n'est jamais un identifiant ; il vit dans le composant, ou dans les fichiers de traduction quand l'i18n est activée.
- **CORE-083** — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.

Lire la section concernée avant de toucher au code correspondant ; les sections suivent le même découpage que les sujets du projet.

## Architecture

Le profil dicte les couches et le sens des imports. Un fichier qui ne trouve pas sa couche est un signal : s'arrêter et demander.

### Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

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

**Anti-patterns**

- **SPA-AP-001** · `eslint-boundaries` — Un dossier `src/utils/` qui collecte tout ce qui ne va nulle part ailleurs.
  Pourquoi : Il devient une dépendance de toutes les couches et n'appartient à aucune.
  À la place : Placer la fonction dans `shared/lib` sous un nom qui dit ce qu'elle fait, ou dans la seule feature qui l'utilise.
- **SPA-AP-002** · `eslint-boundaries` — Importer `../../features/notes/model/useNotes` pour réutiliser un hook.
  Pourquoi : La feature qui importe casse désormais dès que l'autre réorganise son intérieur.
  À la place : Exporter le hook depuis l'index de la feature s'il est public, sinon descendre la logique commune dans `entities/` ou `shared/`.

#### Quand ce profil convient

- L'interface parle à une API HTTP déjà là ou construite en parallèle.
- L'équipe est assez petite pour un seul dépôt et une seule unité de déploiement.
- Les écrans se composent de quelques cas d'usage indépendants.

#### Quand il ne convient pas

- Le produit a besoin de rendu serveur ou de streaming pour le référencement ou le premier affichage.
- Plusieurs équipes possèdent des parties distinctes de la même interface et déploient séparément.
- L'application est surtout du contenu statique avec peu d'interaction.

#### Couches

| Couche | Chemin | Peut dépendre de |
|---|---|---|
| `app` | `src/app` | `features`, `entities`, `shared` |
| `features` | `src/features/*` | `entities`, `shared` |
| `entities` | `src/entities/*` | `shared` |
| `shared` | `src/shared` | rien |

#### Exemple de référence

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

#### Dépendances

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

### Option `state-zustand`

L'état client vit dans de petits stores zustand qui exposent des sélecteurs.

- **ZUS-001** · guidance — Un store ne porte que de l'état client ; aucune donnée serveur n'y entre.
  Pourquoi : Une donnée serveur dans un store est un second cache que personne n'invalide.
- **ZUS-002** · guidance — Un composant s'abonne par un sélecteur, jamais au store entier.
  Pourquoi : S'abonner à tout re-rend tous les écrans à chaque changement.

## Composants et style

Le style passe par les tokens du projet, jamais par des valeurs écrites à la main. Un composant qui n'a pas ses cinq états n'est pas fini.

### Contrat visuel

Ces valeurs viennent du preset et sont générées dans `src/shared/styles/tokens.css`. Pour adapter la marque, redéclarer le token dans `src/shared/styles/tokens.override.css`, qui appartient à l’équipe (CORE-027).

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

### Règles de base

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

**Anti-patterns**

- **CORE-AP-010** · guidance — Retourner `null` pendant le chargement, laissant l'utilisateur devant une zone vide.
  Pourquoi : L'utilisateur ne peut pas distinguer un écran lent d'un écran cassé.
  À la place : Rendre le squelette ou le spinner du design system, dimensionné comme le contenu final.
- **CORE-AP-011** · `jsx-a11y` — Un `<div onClick>` utilisé comme bouton.
  Pourquoi : Il est inatteignable au clavier et invisible pour les technologies d'assistance.
  À la place : Utiliser un `<button>`, stylé avec les tokens du design system.
- **CORE-AP-020** · `stylelint` — Une couleur relevée sur une maquette et collée dans une classe pour un seul écran.
  Pourquoi : Elle marche aujourd'hui et casse le thème sombre, le contrôle de contraste et la refonte suivante.
  À la place : Réutiliser le token sémantique le plus proche, ou en ajouter un au fichier de tokens si le sens est nouveau.

### Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

- **SPA-010** · guidance — Un composant utilisé par deux features remonte dans `shared/ui` dans son propre commit, débarrassé du vocabulaire métier.
  Pourquoi : Promouvoir un composant est une décision ; le copier est la façon dont meurt un design system.

## Accessibilité

L'accessibilité se décide au moment du balisage : rattrapée après coup, elle coûte dix fois plus cher.

### Règles de base

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

**Anti-patterns**

- **CORE-AP-030** · guidance — Signaler un champ invalide par une bordure rouge seulement.
  Pourquoi : L'information est invisible pour un daltonien et pour un lecteur d'écran.
  À la place : Ajouter un message texte relié au champ et annoncé dans une région live.

## Données et formulaires

Les données entrent par un seul endroit, validées ; le cache appartient à la bibliothèque de requêtes, jamais à un état local.

### Règles de base

- **CORE-040** · `eslint` — Tout appel réseau passe par le module `api/` d'une feature ; aucun composant ni hook n'appelle `fetch` directement.
  Pourquoi : Un seul endroit porte l'URL de base, les en-têtes, la gestion d'erreur et la validation.
- **CORE-041** · `typescript` — Une réponse est validée par un schéma zod à la frontière, et le type inféré est le seul type utilisé en aval.
  Pourquoi : Sans validation, un changement d'API silencieux devient une erreur d'exécution trois écrans plus loin.
- **CORE-042** · guidance — Une donnée serveur n'est jamais dupliquée dans un état local ; le module qui l'a chargée en reste la source de vérité unique.
  Pourquoi : Deux copies de la même donnée finissent toujours par diverger.
- **CORE-044** · guidance — Les états de chargement et d'erreur sont traités là où la requête est appelée, pas par chaque composant terminal.
  Pourquoi : Sinon chaque composant finit par porter les trois mêmes branches.
- **CORE-046** · `eslint` — L'URL de base de l'API et toute valeur d'environnement sont lues depuis le module de configuration typé, jamais depuis un littéral dans un composant.
  Pourquoi : Une URL éparpillée dans les composants ne peut pas être changée pour un nouvel environnement.
- **CORE-047** · guidance — Un échec HTTP devient une erreur de domaine typée avant d'atteindre un composant ; un composant n'inspecte jamais un code de statut.
  Pourquoi : Le transport est un détail ; l'écran réagit à `NotFound`, pas à `404`.
- **CORE-050** · `typescript` — Un formulaire est décrit par un unique schéma zod, et son type TypeScript est inféré de ce schéma.
  Pourquoi : Un type écrit à côté d'un schéma est une seconde vérité qui finira par contredire la première.
- **CORE-051** · guidance — Les règles validées côté client sont celles que le serveur applique ; le client n'ajoute jamais une règle qui lui est propre.
  Pourquoi : Une règle uniquement côté client est une promesse que l'API ne tient pas.
- **CORE-052** · `jsx-a11y` — Un message d'erreur est relié à son champ par `aria-describedby` et affiché à côté de lui.
  Pourquoi : Un message en haut d'un formulaire long n'est jamais lu par celui qui en a besoin.
- **CORE-053** · guidance — Le bouton de soumission est désactivé pendant l'envoi et réactivé en cas d'échec.
  Pourquoi : Sans cela, un réseau lent produit des enregistrements en double.
- **CORE-054** · guidance — Chaque champ est enregistré auprès de la bibliothèque de formulaires ; contrôlé et non contrôlé ne sont jamais mélangés dans un même formulaire.
  Pourquoi : Le mélange produit des valeurs qui se réinitialisent sans cause visible.
- **CORE-055** · guidance — Une erreur de validation venue du serveur est rattachée au champ qui l'a causée, ou au formulaire quand elle n'a pas de champ.
  Pourquoi : Une erreur affichée loin de sa cause oblige l'utilisateur à deviner.

**Anti-patterns**

- **CORE-AP-040** · guidance — Copier une ressource chargée dans un état local pour l'éditer.
  Pourquoi : La copie cesse d'être rafraîchie et l'écran montre une donnée périmée après toute mutation.
  À la place : Garder la ressource chargée comme source et ne conserver en local que le brouillon du formulaire.

### Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

- **SPA-009** · guidance — Le module `api/` d'une feature est le seul endroit qui nomme ses endpoints et construit ses clés de cache.
  Pourquoi : Un endpoint écrit à deux endroits est un endpoint modifié à un seul.

### Option `data-tanstack-query`

TanStack Query détient l'état serveur, ses clés de cache et ses invalidations.

- **QRY-001** · guidance — L'état serveur passe par TanStack Query ; un `useEffect` associé à un `useState` ne sert jamais à charger des données.
  Pourquoi : La bibliothèque gère déjà cache, déduplication, réessais et péremption ; les réécrire à la main perd les quatre.
- **QRY-002** · guidance — Les clés de cache sont produites par une fabrique exportée par la feature, jamais écrites en ligne à l'appel.
  Pourquoi : Une clé écrite deux fois est un cache qui n'est jamais invalidé.
- **QRY-003** · guidance — Une mutation déclare les entrées qu'elle invalide ; il n'y a ni boucle de rechargement manuelle ni cache modifié à la main hors mise à jour optimiste.
  Pourquoi : L'invalidation est le contrat du cache ; tout le reste dérive en silence.

### Option `forms-rhf`

Formulaires construits avec react-hook-form, validés par le schéma partagé.

- **FRM-001** · guidance — Un formulaire est enregistré auprès de react-hook-form et validé par son résolveur ; aucun `onChange` écrit à la main par champ.
  Pourquoi : Les gestionnaires écrits à la main re-rendent tout le formulaire et oublient toujours un cas.
- **FRM-002** · `typescript` — Le schéma est déclaré une fois à côté du formulaire et pilote à la fois la validation et le type inféré.
  Pourquoi : Une déclaration, une vérité ; une seconde finit toujours par diverger.

## Tests

Trois niveaux, pas un de plus. Un test qui interroge le DOM comme un utilisateur survit à une refonte du style.

### Règles de base

- **CORE-060** · guidance — Trois niveaux, pas un de plus : unitaire pour la logique pure, composant avec Testing Library et MSW, bout en bout avec Playwright.
  Pourquoi : Le bon niveau est le moins coûteux qui exerce réellement le comportement.
- **CORE-061** · `eslint` — Un test de composant sélectionne par rôle et nom accessible ; une classe CSS ou un nœud du DOM n'est jamais utilisé comme sélecteur.
  Pourquoi : Un test qui interroge le DOM comme un utilisateur survit à une refonte du style et vérifie l'accessibilité au passage.
- **CORE-062** · guidance — Le HTTP est simulé par MSW à la frontière réseau ; `fetch` et le module api ne sont jamais mockés.
  Pourquoi : MSW est au front ce que Testcontainers est au back : aucun faux à la frontière testée.
- **CORE-063** · guidance — Un test est nommé `subject_condition_expectedResult`.
  Pourquoi : Le rapport d'échec se lit alors comme une phrase, sans ouvrir le fichier.
- **CORE-064** · guidance — Il n'y a pas d'objectif chiffré de couverture ; le parcours de référence est couvert de bout en bout à la place.
  Pourquoi : Un pourcentage s'atteint en testant des accesseurs ; un parcours non.
- **CORE-065** · guidance — Aucun instantané d'une page rendue ; les instantanés se limitent à des structures de données sérialisables.
  Pourquoi : Un instantané de page échoue à chaque changement visuel et est mis à jour sans être lu.
- **CORE-066** · `eslint` — Un test n'attend jamais un délai fixe ; il attend une condition via `findBy` ou `waitFor`.
  Pourquoi : Un délai fixe est soit trop court en CI, soit du temps perdu à chaque exécution.
- **CORE-067** · guidance — Les trois niveaux sont écrits dans le même changement que le code qu'ils couvrent.
  Pourquoi : Un changement sans ses tests n'est pas terminé ; les reporter est le meilleur moyen de ne jamais les écrire.

**Anti-patterns**

- **CORE-AP-060** · `eslint` — Attendre un rendu avec un `setTimeout` dans un test.
  Pourquoi : Le test devient instable sur une machine chargée et lent sur une machine rapide.
  À la place : Attendre l'élément ou l'état attendu avec `findBy` ou `waitFor`.

### Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

- **SPA-011** · guidance — Les tests vivent à côté du code qu'ils couvrent, dans la feature, jamais dans un dossier de tests global.
  Pourquoi : Supprimer une feature doit supprimer ses tests avec elle.

### Option `e2e-playwright`

Le parcours de référence est joué dans un vrai navigateur, sur l'application construite.

- **PLAY-001** · `playwright` — Le parcours de référence est couvert par un test de bout en bout exécuté sur le build de production.
  Pourquoi : C'est le seul niveau qui attrape une route cassée, un asset manquant ou une panne propre au build.
- **PLAY-002** · guidance — Un test de bout en bout pilote l'application par des rôles et libellés visibles, jamais par un état interne.
  Pourquoi : Un test qui va chercher à l'intérieur cesse de tester ce que vit l'utilisateur.

## Workflow de l'agent

Ces règles décrivent comment l'agent travaille dans ce dépôt : avant de coder, en codant, en commitant.

### Règles de base

- **CORE-001** · guidance — Avant tout changement non trivial (plus d'un fichier, un changement de schéma ou une nouvelle dépendance), l'agent écrit un plan court et attend confirmation.
  Pourquoi : Un plan relu en trente secondes évite une heure de travail dans la mauvaise direction.
- **CORE-002** · guidance — Une tâche est un changement cohérent et un commit ; refactoring et fonctionnalité ne sont jamais mélangés dans un même commit.
  Pourquoi : Historique relisible ; un commit peut être annulé sans perdre un travail sans rapport.
- **CORE-003** · guidance — L'agent ne crée jamais de commit `WIP`, `tmp` ou `fix later` ; un changement n'est commité que lorsque ses tests passent.
  Pourquoi : Chaque commit de la branche doit être un état sur lequel l'équipe peut s'appuyer.
- **CORE-004** · guidance — Les tests sont écrits dans le même changement que le code qu'ils couvrent, jamais dans un commit ultérieur.
  Pourquoi : Un changement sans ses tests n'est pas terminé ; les reporter est le meilleur moyen de ne jamais les écrire.
- **CORE-005** · guidance — Quand la spécification est ambiguë ou contradictoire, l'agent s'arrête et pose la question ; il ne choisit pas l'interprétation la plus probable.
  Pourquoi : Une mauvaise supposition coûte bien plus à défaire qu'une question à répondre.
- **CORE-006** · guidance — L'ajout d'une dépendance est un commit séparé qui suit la procédure de dépendances du profil.
  Pourquoi : Une dépendance est un engagement de long terme ; elle mérite sa propre revue.
- **CORE-007** · guidance — L'agent n'exécute jamais `git push`, `git reset --hard` ni `git clean`.
  Pourquoi : Ces actions sont irréversibles ou touchent un état partagé ; seul un humain les prend.
- **CORE-080** · guidance — Les identifiants du code (fichiers, composants, hooks, props, variables) sont toujours en anglais.
  Pourquoi : Frameworks, bibliothèques et documentation sont en anglais ; mélanger les langues produit `useUtilisateurQuery`.
- **CORE-081** · guidance — Les commentaires et la documentation sont écrits dans la langue configurée du projet (voir la section réglages du projet).
  Pourquoi : C'est l'équipe qui les lit ; la langue est un choix d'équipe enregistré une fois dans `scaffold.yaml`.
- **CORE-082** · guidance — Un texte affiché à l'utilisateur n'est jamais un identifiant ; il vit dans le composant, ou dans les fichiers de traduction quand l'i18n est activée.
  Pourquoi : La langue de l'interface est une décision produit, sans rapport avec la langue du code.
- **CORE-083** · guidance — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.
  Pourquoi : Un concept, un mot ; les synonymes dans le code sont des bugs en attente.

**Anti-patterns**

- **CORE-AP-001** · guidance — Commiter un changement à moitié fait pour « sauvegarder l'avancement ».
  Pourquoi : La branche contient alors des états qui ne compilent pas ou ne passent pas les tests.
  À la place : Terminer l'étape cohérente, lancer les tests, puis commiter ; garder le travail inachevé dans l'arbre de travail.
- **CORE-AP-002** · guidance — Deviner le comportement attendu quand la spécification n'est pas claire.
  Pourquoi : La supposition est invisible pour le relecteur et devient une décision silencieuse.
  À la place : S'arrêter et poser une question concrète qui liste les interprétations envisagées.
- **CORE-AP-003** · guidance — Glisser un refactoring dans un commit de fonctionnalité « tant qu'on y est ».
  Pourquoi : Le diff mélange intention et bruit ; le relecteur ne sait plus quelles lignes changent le comportement.
  À la place : Faire du refactoring un commit à part, avant ou après la fonctionnalité.

### Option `docker`

Image multi-étapes qui construit le bundle et le sert en fichiers statiques.

- **DOCK-001** · guidance — L'image est construite par le `Dockerfile` multi-étapes depuis les sources, jamais depuis un bundle construit sur un poste.
  Pourquoi : La construction est alors reproductible et identique en CI et sur n'importe quel poste.
- **DOCK-002** · guidance — Le conteneur tourne avec un utilisateur non root et n'expose qu'un seul port.
  Pourquoi : Un processus compromis ne doit pas posséder le conteneur.
- **DOCK-003** · guidance — La configuration d'exécution est injectée au démarrage du conteneur, jamais figée dans le bundle à la construction.
  Pourquoi : Sinon la même image ne peut pas passer de la recette à la production.

### Option `ci-github`

Un workflow GitHub Actions lance les vérifications sur chaque pull request.

- **CIGH-001** · guidance — Le workflow lance la vérification de types, le lint, les tests et le build sur chaque pull request.
  Pourquoi : Ce que la machine ne vérifie pas sur la branche, c'est l'utilisateur qui le vérifie en production.
- **CIGH-002** · guidance — Les dépendances sont installées depuis le fichier de verrouillage avec une installation figée.
  Pourquoi : Une résolution différente de celle du poste transforme la CI en loterie.

### Option `git`

Commits conventionnels, aucun secret commité, commandes interdites à l'agent.

- **GIT-001** · `commitlint` — Un message de commit suit le format Conventional Commits ; le hook `commit-msg` refuse tout le reste.
  Pourquoi : Un historique lisible est la documentation la moins chère qu'une équipe écrive jamais.
- **GIT-002** · `gitleaks` — Le hook `pre-commit` lance gitleaks et refuse le commit quand un secret est détecté.
  Pourquoi : Un secret poussé une fois doit être considéré comme compromis, quoi qu'il arrive ensuite.
- **GIT-003** · guidance — L'agent ne lance jamais `git push`, `git reset --hard` ni `git clean`.
  Pourquoi : Ces trois commandes détruisent un travail que seule l'équipe peut décider de perdre.

## Sécurité

Tout ce qui part dans le bundle est public : la sécurité du front consiste à ne jamais y mettre ce qui doit rester secret.

### Règles de base

- **CORE-070** · `gitleaks` — Tout ce qui part dans le bundle est public ; aucun secret, clé ou jeton privé n'est jamais lu par le code du navigateur.
  Pourquoi : Une variable `VITE_` est inlinée à la construction et lisible par quiconque ouvre les sources.
- **CORE-071** · `gitleaks` — `.env.example` est commité avec toutes les variables attendues ; `.env` est ignoré et jamais commité.
  Pourquoi : Un nouvel arrivant doit pouvoir démarrer le projet sans demander quelles variables existent.
- **CORE-072** · `eslint` — `dangerouslySetInnerHTML` n'est utilisé que sur du contenu assaini par le module dédié de `shared/`.
  Pourquoi : Tout autre usage transforme une chaîne stockée en exécution de script.
- **CORE-073** · `eslint` — Un lien ouvert dans un nouvel onglet porte `rel="noopener noreferrer"`.
  Pourquoi : Sans cela, la page ouverte peut piloter l'onglet dont elle vient.
- **CORE-074** · guidance — Un jeton d'authentification n'est jamais écrit dans `localStorage` ni `sessionStorage`.
  Pourquoi : N'importe quel script injecté les lit ; un cookie posé par le serveur n'a pas cette faiblesse.
- **CORE-075** · guidance — Une Content-Security-Policy est servie en production et l'application n'embarque aucun script inline.
  Pourquoi : La politique est la dernière barrière quand une injection passe.
- **CORE-076** · guidance — Une saisie utilisateur interpolée dans une URL est encodée, et une URL venue des données n'est jamais utilisée en `src` ou `href` sans vérifier son schéma.
  Pourquoi : Une URL `javascript:` stockée dans un champ s'exécute au clic.
- **CORE-077** · guidance — Les dépendances sont auditées en CI, et en ajouter une fait l'objet d'un commit séparé qui dit pourquoi elle est nécessaire.
  Pourquoi : L'arbre de dépendances du front est la plus large surface d'attaque du projet.

**Anti-patterns**

- **CORE-AP-070** · `gitleaks` — Mettre une clé d'API dans une variable `VITE_` et la considérer comme privée.
  Pourquoi : La valeur se retrouve dans le bundle JavaScript, en clair.
  À la place : Garder la clé sur un serveur et l'appeler à travers le backend du projet.

### Option `security-oidc-bff`

La session vit dans un backend-for-frontend ; le navigateur ne voit jamais de jeton.

- **SECO-001** · guidance — Le navigateur ne manipule jamais de jeton d'accès ni de rafraîchissement ; le backend-for-frontend tient la session et pose un cookie http-only.
  Pourquoi : Un jeton lisible par JavaScript est un jeton qu'un script injecté peut voler.
- **SECO-002** · guidance — Une réponse 401 envoie l'utilisateur vers l'endpoint de connexion du backend-for-frontend, jamais dans une boucle de réessai silencieuse.
  Pourquoi : Une boucle de réessai sur une session expirée martèle l'API et laisse l'utilisateur devant un écran vide.
- **SECO-003** · guidance — Masquer une route dans le client est un confort ; l'API refuse un appel non autorisé quoi qu'affiche l'interface.
  Pourquoi : L'interface est téléchargeable et modifiable par n'importe qui.

#### Variables d'environnement attendues

| Variable | Exemple | Rôle |
|---|---|---|
| `VITE_AUTH_LOGIN_PATH` | `/bff/login` | Chemin de l'endpoint du backend-for-frontend qui démarre la connexion. |

## Commandes

- `pnpm dev` — démarre Vite en développement
- `pnpm build` — construit le bundle de production
- `pnpm lint` — ESLint, frontières de couches et accessibilité
- `pnpm test` — tests unitaires et de composants
- `pnpm e2e` — parcours de référence dans un navigateur
- `prepwork sync` — met à jour les fichiers générés après un changement de `scaffold.yaml`

## Réglages du projet

|  |  |
|---|---|
| Langue des commentaires | français |
| Langue de la documentation | français |

## Propriété des fichiers

- Les fichiers listés dans `.scaffold/manifest.json` sont générés : ne pas les éditer, ils seraient écrasés ou signalés par `prepwork sync`.
- `docs/adr/`, `docs/glossary.md` et tout le code métier appartiennent à l'équipe et ne sont jamais dans le manifeste.
- L'exemple de référence (`Note`) est généré ; le supprimer ou le modifier est un choix d'équipe, `sync` le signale sans le recréer.

## Git

- Auteur des commits : `Hery <hery@example.com>`
- Chaque commit de l'agent porte le trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Interdit à l'agent : `git push`, `git reset --hard`, `git clean`.


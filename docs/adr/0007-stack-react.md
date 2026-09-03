# ADR 0007 — Stack React : un deuxième pack de contenu sur un cœur extrait

Date : 2026-09-03 · Statut : accepté

## Contexte

prepwork v1 ne prépare le terrain que pour Spring Boot. La même question se pose pour une interface
React : squelette, conventions d'affichage des composants, typographie, et l'ensemble des choix
qu'une équipe front doit arrêter avant la première ligne de code métier.

Mesure du couplage à Java avant de décider, en nombre de mentions `java|maven|spring|pom|archunit`
dans `src/` : `fs/` 0, `cli/` 1, `renderers/` 12 (des libellés), `config/` 9, `questionnaire/` 10,
`catalog/` 27, `engine/` 47. Le plan, l'exécution, le manifeste, le hachage et le renderer
`claude-code` ne savent déjà rien de Java. Ce qui est lié à Spring : la forme de `scaffold.yaml`, les
contributions (`maven`, `application_properties`), l'enum `enforced_by`, le tri d'imports Java, et
les 106 fichiers de `content/`.

## Décision

### 1. Un seul outil, un cœur extrait, des packs de stack

`scaffold.yaml` gagne `stack.target: spring-boot | react`. Le cœur reste unique et sept points sont
généralisés :

1. `ScaffoldSchema` devient une union discriminée sur `stack.target` ; `base_package` et les mots
   réservés Java descendent dans le pack `spring-boot`.
2. `enforced_by` et les noms de skills cessent d'être des enums en dur : chaque pack déclare les
   siens, le catalogue valide contre cette déclaration.
3. `MavenContribution` et `application_properties` deviennent un emplacement `contributions` typé par
   le pack (React : dépendances et scripts `package.json`, fragments `tsconfig` et ESLint).
4. `LayerSchema.package` (regex de package Java) devient un chemin ou un identifiant de module.
5. `reference_example.tables` (SQL) descend dans le pack `spring-boot`.
6. `java-format.ts` devient un point d'extension `postProcess` fourni par le pack ; React : Prettier.
7. `content/` se réorganise en `content/common/`, `content/spring-boot/`, `content/react/`.

Règle de garde : **aucun `if (stack === 'react')` dans le cœur**. Une différence de stack qui ne
s'exprime pas par une contribution ou un point d'extension est un défaut de découpage.

Écarté : un deuxième dépôt (divergence du moteur garantie) et un paquet `@prepwork/core` publié
(publication npm à gérer pour un seul consommateur interne).

### 2. Cible v1 : SPA Vite + React Router, profil `spa-feature`

Un seul profil en v1. Next.js App Router n'est pas écarté : ce sera un deuxième profil, dont la règle
centrale est la frontière serveur/client — pas avant que le premier soit vérifié de bout en bout.
Épinglés par l'outil, donc jamais demandés : pnpm, TypeScript strict, React 19, Vite, Tailwind 4,
Vitest.

### 3. Couches et règles de frontière

| Couche          | Rôle                                          | Peut dépendre de       |
| --------------- | --------------------------------------------- | ---------------------- |
| `app/`          | bootstrap, providers, routes                  | tout                   |
| `features/<f>/` | un cas d'usage : `ui/`, `model/`, `api/`      | `entities/`, `shared/` |
| `entities/<e>/` | types métier, mapping, affichage d'une entité | `shared/`              |
| `shared/`       | `ui/` (kit), `lib/`, `config/`                | rien                   |

Les deux règles structurantes : une feature n'importe jamais une autre feature (elles se composent
dans `app/`) ; on n'importe que l'index public d'une couche, jamais un fichier interne.

Elles sont outillées par `eslint-plugin-boundaries` et `dependency-cruiser`, avec l'identifiant de
règle dans le nom de la règle lint (`SPA-002`), comme les tests ArchUnit portent `LAY_002`. Le
contrôle de cohérence de `content/` vérifie qu'une règle `enforced_by: eslint-boundaries` a bien son
entrée de configuration — transposition directe du contrôle existant côté ArchUnit.

### 4. Valeurs de `enforced_by` du pack `react`

`eslint-boundaries`, `dependency-cruiser`, `typescript`, `eslint`, `jsx-a11y`, `stylelint`,
`prettier`, `vitest`, `playwright`, `commitlint`, `gitleaks`, `none`.

Skills du pack : `architecture`, `ui`, `a11y`, `data`, `testing`, `workflow`, `security`.
L'accessibilité est un skill à part et non un chapitre de `ui` : c'est un corps de règles qu'un agent
doit lire avant de toucher au balisage.

### 5. `core/` du pack `react` (préfixe `WEB`)

- **Composants** — cinq états obligatoires : chargement, vide, erreur, désactivé, `focus-visible`. Un
  composant de présentation ne va jamais chercher ses données.
- **Données** — tout accès réseau passe par `api/`, typé et validé par zod à la frontière ; le cache
  appartient à TanStack Query, jamais à un `useState` ; chargement et erreur traités dans la feature.
- **Formulaires** — un schéma zod unique sert la validation et le type ; message d'erreur relié au
  champ par `aria-describedby`.
- **Accessibilité** — rôles et libellés plutôt que classes, cible tactile 44 px, contraste AA,
  `prefers-reduced-motion`.
- **Style** — tokens uniquement : ni hex brut, ni valeur arbitraire Tailwind, ni `!important`.
- **Tests** — trois niveaux, comme côté Spring : unitaire (logique pure), composant (Testing Library
  et MSW), e2e Playwright sur le parcours de référence. MSW est au front ce que Testcontainers est au
  back : pas de faux à la frontière. Sélection par rôle et libellé, jamais par classe CSS.
- **Sécurité** — pas de `dangerouslySetInnerHTML` sans sanitize, aucun secret dans le bundle
  (`VITE_*` est public), CSP explicite.

### 6. Contrat visuel : Tailwind 4, tokens sémantiques, presets

En Tailwind 4 la configuration est du CSS (`@theme`) : le preset **est** le fichier de tokens.

| Preset               | Typographie             | Échelle             | Usage                 |
| -------------------- | ----------------------- | ------------------- | --------------------- |
| `app-sober` (défaut) | Inter + JetBrains Mono  | 1,200 · rayon 8     | application métier    |
| `editorial`          | serif en titres + Inter | 1,250 · mesure 68ch | produit de contenu    |
| `dense`              | system-ui               | 1,125 · rayon 4     | back-office, tableaux |

Chaque preset fixe familles, échelle modulaire, graisses autorisées, interlignage, échelle
d'espacement de base 4, rayons, breakpoints et une palette **sémantique** (`background`, `surface`,
`text`, `muted`, `border`, `primary`, `destructive`, `success`) en clair et en sombre, vérifiée au
contraste AA. Le thème sombre est une redéfinition des mêmes tokens, jamais une seconde palette.

Propriété des fichiers, en appliquant le modèle existant : `src/shared/styles/tokens.css` est un
**fichier d'équipe** — écrit une fois, jamais écrasé, c'est là que vit la marque. `app.css` et les
configurations de lint qui contraignent l'usage des tokens restent générés. Les composants shadcn
copiés dans `shared/ui/` sont eux aussi des fichiers d'équipe : les posséder est tout l'intérêt de
shadcn.

Écarté : MUI (le design system impose déjà ses conventions, l'outil perd son objet), vanilla-extract
et CSS Modules purs (tout le catalogue de composants serait à écrire) ; des tokens figés par l'outil
(aucune adaptation à une marque) ou un fichier vide (un projet démarré vite reste sans identité et
l'agent improvise).

### 7. Questionnaire du pack `react`

Nom · description · données [TanStack Query] · formulaires [react-hook-form + zod] · état client
[zustand] · auth [aucune] / OIDC-BFF / session · i18n [non] · preset visuel [app-sober] · thème
sombre [oui] · e2e [oui] · Docker [oui, nginx multi-étages] · CI [github] · git · langues.

### 8. Exemple de référence

La feature `notes`, miroir exact de l'exemple Spring : liste paginée avec ses trois états, formulaire
de création validé, détail. Un test par niveau, chaque fichier rattaché aux identifiants de règles
qu'il démontre.

### 9. `content/common/` : le workflow de l'agent est partagé

`core/workflow.yaml` (plan avant changement, une tâche = un commit, tests dans le même changement,
arrêt sur ambiguïté, dépendance en commit séparé, commandes interdites) ne dépend d'aucune stack et
remonte dans `content/common/`, consommé par les deux packs.

## Conséquences

- `SCAFFOLD_VERSION` passe à `1.1.0`. L'absence de `stack.target` vaut `spring-boot` : les projets
  générés par la v1 continuent de se synchroniser sans modification.
- Le contrôle de cohérence de `content/` et la génération des JSON Schema deviennent par pack.
- Deux matrices en CI : la matrice Java existante (18 combinaisons) et une matrice front (`build`,
  `lint`, `test`, `e2e`).
- L'axe `renderer` garde tout son sens : un `AGENTS.md` produit depuis les mêmes YAML profitera aux
  deux packs.
- Preuve de non-régression de l'extraction : les 5 golden files et la matrice 18/18 doivent rester
  verts sans être modifiés. Un golden file qui change pendant l'étape 1 signale un changement de
  comportement du cœur, pas une mise à jour à accepter.

## Ordre d'implémentation

1. Extraction du cœur et packs déclaratifs, sans aucun contenu React.
2. Schémas et contenu YAML : `core/` du pack `react` et profil `spa-feature`.
3. Relecture d'un `CLAUDE.md` React réellement rendu, avant tout squelette.
4. Squelette Vite, tokens, shadcn, feature `notes`, lint de frontières ; vérifié par
   `pnpm build && pnpm lint && pnpm test && pnpm e2e`.
5. Questionnaire du pack `react`, puis matrice de génération front.

## Amendements

**2026-09-03, en écrivant le contenu (étape 2 ci-dessus).**

- **Le préfixe du `core/` reste `CORE-`, pas `WEB-`.** Le contrôle de cohérence réserve `CORE` aux
  règles de `core/`, quel que soit le pack, et les identifiants ne sont uniques qu'à l'intérieur
  d'un catalogue. Deux préfixes pour la même notion auraient coûté un point d'extension sans rien
  apporter au lecteur.
- **L'option des formulaires s'appelle `forms-rhf`**, et non `forms-rhf-zod` : le contrôle
  d'orthogonalité déduit ses marqueurs de l'identifiant de l'option, et `zod` — dépendance du
  profil, citée par les règles de base — en serait devenu un.
- **Trois points d'extension supplémentaires** sont apparus en généralisant : `carriesRuleEvidence`
  (quel template peut porter la preuve d'une règle outillée : un test côté Spring, une
  configuration de lint côté React), `genericOptionWords` (les mots trop banals pour servir de
  marqueur d'orthogonalité) et `catalogSpecValues` (l'union des valeurs des packs, pour le schéma
  JSON de `content/common`).
- **Deux formulations partagées ont été nettoyées** : la règle `CORE-007` et la ligne « interdit à
  l'agent » du renderer ne parlent plus de migration de base de données — la protection reste,
  portée par les options `migrations-*` qui apportent les migrations. Sept golden files du pack
  `spring-boot` changent d'une ligne, délibérément.
- **`.gitignore` ignorait les `CLAUDE.md` des golden files** : le motif `CLAUDE.md` s'applique à
  toutes les profondeurs. Il est ancré (`/CLAUDE.md`) et les cinq fichiers manquants sont commités —
  sans quoi le test golden échouait sur un clone neuf, donc en CI.
- **Le contraste des presets est vérifié par un test**, et non plus seulement annoncé : les huit
  paires de texte de chaque preset, dans les deux thèmes, restent au-dessus de 4,5:1.

**2026-09-03, en écrivant le squelette (étape 4 ci-dessus).**

- **`data` et `forms` quittent les options pour `stack`.** Ces deux choix changent l'écriture de
  chaque feature — le hook de chargement, le formulaire — donc le profil doit pouvoir conditionner
  ses fichiers dessus, exactement comme le profil `layered` se conditionne sur `stack.database`.
  Une option, elle, reste un calque que le profil ignore. Les options du catalogue
  (`data-tanstack-query`, `forms-rhf`…) ne bougent pas : `resolveOptionIds` les déduit désormais de
  `stack`, comme `migrations-flyway` est déduit de `stack.migrations`.
- **Les tokens sont déclarés dans les espaces de noms de Tailwind** (`--color-*`, `--text-*`,
  `--radius-*`, `--spacing`, `--container-*`). Chaque token devient donc une classe utilitaire
  (`bg-primary`, `text-lg`, `rounded-md`) et le squelette n'écrit plus une seule valeur entre
  crochets — ce que la règle CORE-021 interdit précisément. La première version des composants
  échouait à son propre lint.
- **Pas d'`AbortSignal` dans l'exemple de référence** : jsdom et le `fetch` de Node n'exposent pas
  la même classe, et un signal passé à travers casse tout test de composant. Un squelette ne doit
  pas embarquer un contournement d'environnement ; l'équipe ajoutera l'annulation quand elle en
  aura besoin.
- **`eslint-import-resolver-typescript` est indispensable** : sans lui, eslint-plugin-boundaries ne
  rattache aucun import à une couche et les règles de frontière ne signalent rien tout en paraissant
  actives. Vérifié par un test négatif — import croisé entre features et import profond, les deux
  refusés avec l'identifiant de la règle.
- **La configuration d'exécution est réellement lue** : l'option `docker` sert un
  `runtime-config.js` à côté du bundle et le socle le fait primer sur les valeurs du build, sinon
  DOCK-003 était une promesse vide. La CI copie `.env.example` en `.env` : un dépôt fraîchement
  cloné n'a pas de `.env`, et l'application refuse de démarrer sans configuration valide.

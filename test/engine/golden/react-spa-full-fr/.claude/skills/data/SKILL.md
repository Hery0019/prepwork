---
name: "data"
description: "Couche `api`, validation aux frontières, cache et formulaires. À lire avant d'appeler le réseau."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Données et formulaires

Les données entrent par un seul endroit, validées ; le cache appartient à la bibliothèque de requêtes, jamais à un état local.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

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

### Anti-patterns

- **CORE-AP-040** · guidance — Copier une ressource chargée dans un état local pour l'éditer.
  Pourquoi : La copie cesse d'être rafraîchie et l'écran montre une donnée périmée après toute mutation.
  À la place : Garder la ressource chargée comme source et ne conserver en local que le brouillon du formulaire.

## Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

### Règles

- **SPA-009** · guidance — Le module `api/` d'une feature est le seul endroit qui nomme ses endpoints et construit ses clés de cache.
  Pourquoi : Un endpoint écrit à deux endroits est un endpoint modifié à un seul.

## Option `data-tanstack-query`

TanStack Query détient l'état serveur, ses clés de cache et ses invalidations.

### Règles

- **QRY-001** · guidance — L'état serveur passe par TanStack Query ; un `useEffect` associé à un `useState` ne sert jamais à charger des données.
  Pourquoi : La bibliothèque gère déjà cache, déduplication, réessais et péremption ; les réécrire à la main perd les quatre.
- **QRY-002** · guidance — Les clés de cache sont produites par une fabrique exportée par la feature, jamais écrites en ligne à l'appel.
  Pourquoi : Une clé écrite deux fois est un cache qui n'est jamais invalidé.
- **QRY-003** · guidance — Une mutation déclare les entrées qu'elle invalide ; il n'y a ni boucle de rechargement manuelle ni cache modifié à la main hors mise à jour optimiste.
  Pourquoi : L'invalidation est le contrat du cache ; tout le reste dérive en silence.

## Option `forms-rhf`

Formulaires construits avec react-hook-form, validés par le schéma partagé.

### Règles

- **FRM-001** · guidance — Un formulaire est enregistré auprès de react-hook-form et validé par son résolveur ; aucun `onChange` écrit à la main par champ.
  Pourquoi : Les gestionnaires écrits à la main re-rendent tout le formulaire et oublient toujours un cas.
- **FRM-002** · `typescript` — Le schéma est déclaré une fois à côté du formulaire et pilote à la fois la validation et le type inféré.
  Pourquoi : Une déclaration, une vérité ; une seconde finit toujours par diverger.

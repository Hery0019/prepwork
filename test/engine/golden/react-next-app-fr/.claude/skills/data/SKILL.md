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

## Profil `next-app`

Next.js App Router, rendu sur le serveur par défaut, un dossier par cas d'usage.

### Règles

- **NEXT-003** · guidance — Les lectures se font dans un composant serveur via le module `api/` de la feature ; la donnée descend ensuite en props.
  Pourquoi : Le HTML arrive complet, et le client ne garde aucune copie de ce que le serveur sait déjà.
- **NEXT-004** · guidance — Les écritures passent par une action serveur exportée par la feature ; un composant client n'appelle jamais l'API directement.
  Pourquoi : Les identifiants et l'URL de base de l'API ne quittent jamais le serveur.
- **NEXT-005** · guidance — Une action serveur revalide les chemins ou les étiquettes qu'elle invalide, et ne recharge jamais à la main.
  Pourquoi : La revalidation est le contrat de cache du framework ; tout le reste dérive en silence.
- **NEXT-013** · guidance — Une page qui lit des données vivantes déclare son intention de cache — rendu dynamique ou fenêtre de revalidation — parce que le framework rend statiquement par défaut.
  Pourquoi : Sinon le build tente de prérendre la page et échoue, ou livre une donnée figée au moment de la construction.

### Anti-patterns

- **NEXT-AP-002** · `eslint-boundaries` — Appeler l'API depuis un composant client avec `fetch`, parce que l'action serveur paraissait plus lourde.
  Pourquoi : L'URL de base de l'API et ses identifiants finissent dans le bundle du navigateur.
  À la place : Exporter une action serveur depuis la feature et l'appeler depuis le formulaire.

## Option `data-none`

Aucune bibliothèque de cache ; le module api expose des fonctions asynchrones simples.

### Règles

- **DNONE-001** · guidance — Chaque écran porte explicitement ses états de chargement et d'erreur, à côté de l'appel qu'il fait.
  Pourquoi : Sans bibliothèque, les trois états sont à la charge du développeur et doivent rester visibles.
- **DNONE-002** · guidance — Aucun cache maison : une ressource est soit redemandée, soit passée en prop.
  Pourquoi : Un cache écrit à la main est une bibliothèque sans tests et sans stratégie d'invalidation.

## Option `forms-none`

Aucune bibliothèque de formulaires ; les champs sont contrôlés explicitement et validés à la soumission.

### Règles

- **FNONE-001** · guidance — Chaque champ est contrôlé explicitement et le formulaire entier est validé par son schéma à la soumission.
  Pourquoi : Valider champ par champ à chaque frappe transforme un petit formulaire en machine à états.

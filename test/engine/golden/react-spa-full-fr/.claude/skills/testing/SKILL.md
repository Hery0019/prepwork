---
name: "testing"
description: "Les trois niveaux, MSW, sélection par rôle. À lire avant d'écrire ou modifier un test."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Tests

Trois niveaux, pas un de plus. Un test qui interroge le DOM comme un utilisateur survit à une refonte du style.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

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

### Anti-patterns

- **CORE-AP-060** · `eslint` — Attendre un rendu avec un `setTimeout` dans un test.
  Pourquoi : Le test devient instable sur une machine chargée et lent sur une machine rapide.
  À la place : Attendre l'élément ou l'état attendu avec `findBy` ou `waitFor`.

## Profil `spa-feature`

Application monopage Vite, un dossier par cas d'usage, imports circulant strictement vers le bas.

### Règles

- **SPA-011** · guidance — Les tests vivent à côté du code qu'ils couvrent, dans la feature, jamais dans un dossier de tests global.
  Pourquoi : Supprimer une feature doit supprimer ses tests avec elle.

## Option `e2e-playwright`

Le parcours de référence est joué dans un vrai navigateur, sur l'application construite.

### Règles

- **PLAY-001** · `playwright` — Le parcours de référence est couvert par un test de bout en bout exécuté sur le build de production.
  Pourquoi : C'est le seul niveau qui attrape une route cassée, un asset manquant ou une panne propre au build.
- **PLAY-002** · guidance — Un test de bout en bout pilote l'application par des rôles et libellés visibles, jamais par un état interne.
  Pourquoi : Un test qui va chercher à l'intérieur cesse de tester ce que vit l'utilisateur.

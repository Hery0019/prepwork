---
name: "testing"
description: "Les trois niveaux, Testcontainers, marqueurs et nommage. À lire avant d'écrire ou de modifier un test."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Tests

Trois niveaux, pas un de plus. Le bon niveau est le moins coûteux qui exerce réellement le comportement.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-020** · guidance — Il existe exactement trois niveaux de test, unitaire (sans application), slice (`httpx.ASGITransport` avec la couche service doublée) et intégration (`httpx` avec Testcontainers).
  Pourquoi : Chaque niveau a un coût et un rôle ; une quatrième catégorie est le début de la confusion.
- **CORE-021** · `pytest` — La persistance est testée sur le vrai moteur de base de données via Testcontainers ; SQLite ne lui est jamais substitué.
  Pourquoi : SQLite ne connaît ni les types de colonnes, ni les contraintes différées, ni le SQL qu'Alembic génère.
- **CORE-022** · guidance — Les fonctions de test sont nommées `test_<method>_<condition>_<expected_result>`, en snake_case.
  Pourquoi : Le nom d'un test en échec doit dire ce qui casse sans ouvrir le fichier.
- **CORE-023** · `pytest` — Chaque test porte exactement un marqueur de niveau, `@pytest.mark.unit`, `@pytest.mark.slice` ou `@pytest.mark.integration`.
  Pourquoi : `pytest -m "not integration"` doit lancer toute la suite qui n'a pas besoin de Docker.
- **CORE-024** · guidance — Aucun seuil numérique de couverture n'est imposé ; un test est jugé sur ce qu'il vérifie.
  Pourquoi : Un objectif en pourcentage produit des tests sans assertion écrits pour la métrique.
- **CORE-025** · guidance — Toute fonctionnalité est livrée avec au moins un test unitaire, plus le test slice de chaque endpoint qu'elle ajoute.
  Pourquoi : L'exemple de référence montre un test par niveau ; le nouveau code suit la même forme.

### Anti-patterns

- **CORE-AP-020** · guidance — Démarrer l'application complète pour tous les tests parce que « ça marche toujours ».
  Pourquoi : La suite dure des minutes et plus personne ne la lance avant de pousser.
  À la place : Choisir le niveau le moins coûteux qui exerce le comportement testé.
- **CORE-AP-021** · guidance — Pointer l'URL de base de test sur `sqlite+aiosqlite:///:memory:` pour accélérer la suite.
  Pourquoi : Le test valide le faux, pas le SQL qui tournera en production.
  À la place : Un test d'intégration sur la base Testcontainers.
- **CORE-AP-022** · guidance — Des noms de test tels que `test_1`, `test_it_works` ou `test_create`.
  Pourquoi : Le nom n'apporte aucune information quand il apparaît dans un rapport d'échec.
  À la place : `test_create_title_blank_returns_400` : méthode, condition, résultat attendu.

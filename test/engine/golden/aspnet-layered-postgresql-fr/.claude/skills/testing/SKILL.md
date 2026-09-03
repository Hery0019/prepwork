---
name: "testing"
description: "Les trois niveaux de test, Testcontainers, nommage. À lire avant d'écrire ou modifier un test."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Tests

Trois niveaux, pas un de plus. Le bon niveau est le moins coûteux qui exerce réellement le comportement.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-020** · guidance — Il existe exactement trois niveaux de test, unitaire (sans hôte), slice (`WebApplicationFactory` avec la couche applicative doublée) et intégration (`WebApplicationFactory` avec Testcontainers).
  Pourquoi : Chaque niveau a un coût et un rôle ; une quatrième catégorie est le début de la confusion.
- **CORE-021** · `arch-test` — La persistance est testée sur le vrai moteur de base de données via Testcontainers ; le provider `InMemory` n'est jamais utilisé.
  Pourquoi : Le provider InMemory n'est pas une base relationnelle et Microsoft lui-même déconseille de tester avec.
- **CORE-022** · guidance — Les méthodes de test sont nommées `Method_Condition_ExpectedResult`.
  Pourquoi : Le nom d'un test en échec doit dire ce qui casse sans ouvrir le fichier.
- **CORE-023** · `arch-test` — Chaque test porte un `[Trait("Category", …)]` qui nomme son niveau, `Unit`, `Slice` ou `Integration`.
  Pourquoi : `dotnet test --filter Category!=Integration` doit lancer toute la suite qui n'a pas besoin de Docker.
- **CORE-024** · guidance — Aucun seuil numérique de couverture n'est imposé ; un test est jugé sur ce qu'il vérifie.
  Pourquoi : Un objectif en pourcentage produit des tests sans assertion écrits pour la métrique.
- **CORE-025** · guidance — Toute fonctionnalité est livrée avec au moins un test unitaire, plus le test slice de chaque endpoint qu'elle ajoute.
  Pourquoi : L'exemple de référence montre un test par niveau ; le nouveau code suit la même forme.

### Anti-patterns

- **CORE-AP-020** · guidance — Démarrer l'hôte complet pour tous les tests parce que « ça marche toujours ».
  Pourquoi : La suite dure des minutes et plus personne ne la lance avant de pousser.
  À la place : Choisir le niveau le moins coûteux qui exerce le comportement testé.
- **CORE-AP-021** · guidance — Remplacer le provider par `UseInMemoryDatabase` ou SQLite dans un test de persistance.
  Pourquoi : Le test valide le faux, pas le SQL qui tournera en production.
  À la place : Un test d'intégration sur la base Testcontainers.
- **CORE-AP-022** · guidance — Des noms de test tels que `Test1`, `ShouldWork` ou `TestCreate`.
  Pourquoi : Le nom n'apporte aucune information quand il apparaît dans un rapport d'échec.
  À la place : `Create_TitleBlank_Returns400` : méthode, condition, résultat attendu.

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

- **CORE-020** · guidance — Il existe exactement trois niveaux de test, unitaire (sans contexte Spring), slice (`@WebMvcTest`, `@DataJpaTest`) et intégration (`@SpringBootTest` avec Testcontainers).
  Pourquoi : Chaque niveau a un coût et un rôle ; une quatrième catégorie est le début de la confusion.
- **CORE-021** · `archunit` — Les tests slice et d'intégration tournent sur le vrai moteur de base de données via Testcontainers ; H2 n'est jamais utilisé.
  Pourquoi : Les dialectes SQL diffèrent ; un test qui passe sur H2 ne prouve rien pour la production.
- **CORE-022** · guidance — Les méthodes de test sont nommées `method_condition_expectedResult`.
  Pourquoi : Le nom d'un test en échec doit dire ce qui casse sans ouvrir le fichier.
- **CORE-023** · guidance — Aucun seuil numérique de couverture n'est imposé ; un test est jugé sur ce qu'il vérifie.
  Pourquoi : Un objectif en pourcentage produit des tests sans assertion écrits pour la métrique.
- **CORE-024** · guidance — Un test unitaire ne démarre jamais de contexte Spring ; les dépendances sont passées en objets simples ou en mocks.
  Pourquoi : Un test unitaire doit tourner en millisecondes pour être lancé en permanence.
- **CORE-025** · guidance — Toute fonctionnalité est livrée avec au moins un test unitaire, plus le test slice de chaque contrôleur ou repository qu'elle ajoute.
  Pourquoi : L'exemple de référence montre un test par niveau ; le nouveau code suit la même forme.

### Anti-patterns

- **CORE-AP-020** · guidance — Utiliser `@SpringBootTest` pour tous les tests parce que « ça marche toujours ».
  Pourquoi : La suite dure des minutes et plus personne ne la lance avant de pousser.
  À la place : Choisir le niveau le moins coûteux qui exerce le comportement testé.
- **CORE-AP-021** · guidance — Remplacer la base par H2 ou un faux en mémoire dans un test de persistance.
  Pourquoi : Le test valide le faux, pas le SQL qui tournera en production.
  À la place : Un `@DataJpaTest` sur la base Testcontainers.
- **CORE-AP-022** · guidance — Des noms de test tels que `test1`, `shouldWork` ou `testCreate`.
  Pourquoi : Le nom n'apporte aucune information quand il apparaît dans un rapport d'échec.
  À la place : `create_titleBlank_returns400` : méthode, condition, résultat attendu.

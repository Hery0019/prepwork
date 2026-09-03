---
name: "architecture"
description: "Projets, espaces de noms, sens des dépendances et exemple de référence du projet. À lire avant de créer une classe ou d'ajouter une référence."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Architecture

Le profil d'architecture dicte le graphe de projets, les règles NetArchTest et l'exemple de référence. Une classe qui ne trouve pas sa place dans un projet est un signal : s'arrêter et demander.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Profil `layered`

Monolithe en couches — Api, Application, Infrastructure, Domain, un projet chacun.

### Quand ce profil convient

- Une seule équipe, un seul déployable, un domaine qui n'est pas encore découpé.
- L'équipe veut des frontières de couches tenues par le build plutôt que par la revue.
- Des applications surtout CRUD dont les règles métier tiennent dans des services applicatifs.

### Quand il ne convient pas

- Plusieurs domaines métier qui ont déjà leur propre cycle de vie.
- Une équipe qui veut un dossier par fonctionnalité plutôt qu'un projet par couche.

### Couches

| Couche | Espace de noms | Peut dépendre de |
|---|---|---|
| `domain` | `Solumada.PayFlow.Domain` | rien |
| `application` | `Solumada.PayFlow.Application` | `domain` |
| `infrastructure` | `Solumada.PayFlow.Infrastructure` | `application`, `domain` |
| `api` | `Solumada.PayFlow.Api` | `application`, `domain`, `infrastructure` |

### Règles

- **NET-001** · `compiler` — Le projet `Domain` ne référence aucun autre projet ni aucun paquet d'infrastructure.
  Pourquoi : Un domaine qui compile seul se lit, se teste et se déplace sans traîner un framework.
- **NET-002** · `compiler` — Le projet `Application` ne référence ni `Infrastructure` ni EF Core ; il déclare les ports que l'infrastructure implémente.
  Pourquoi : Les cas d'usage doivent s'exprimer sans nommer une base ; la référence absente rend la triche impossible.
- **NET-003** · `arch-test` — Seule la racine de composition nomme un type d'`Infrastructure` — `Program` et les méthodes d'extension `Add*`.
  Pourquoi : L'`Api` doit référencer l'`Infrastructure` pour l'enregistrer ; tout ce qui dépasse cet enregistrement est une couche court-circuitée.
- **NET-009** · guidance — Chaque couche vit dans le projet `<Racine>.<Couche>` ; aucun autre projet n'existe sous `src/`.
  Pourquoi : Un cinquième projet est une décision d'architecture, donc il passe par un ADR.
- **NET-010** · guidance — Chaque projet enregistre ses propres services dans une unique méthode d'extension `Add<Couche>` appelée par `Program`.
  Pourquoi : La racine de composition reste lisible et chaque couche possède ses durées de vie.

### Anti-patterns

- **NET-AP-001** · guidance — Ajouter une `ProjectReference` pour « juste accéder à cette classe ».
  Pourquoi : Le graphe de références est l'architecture ; l'élargir en silence supprime la seule frontière que le compilateur tenait.
  À la place : Descendre le type dans une couche que les deux projets référencent déjà, ou déclarer un port.

### Exemple de référence

Notes — créer, lire une note, lister avec pagination.

Fichiers :

- `src/Solumada.PayFlow.Domain/Notes/Note.cs`
- `src/Solumada.PayFlow.Application/Notes/INoteRepository.cs`
- `src/Solumada.PayFlow.Application/Notes/NoteView.cs`
- `src/Solumada.PayFlow.Application/Notes/NoteService.cs`
- `src/Solumada.PayFlow.Infrastructure/Notes/NoteRepository.cs`
- `src/Solumada.PayFlow.Api/Notes/NotesController.cs`
- `src/Solumada.PayFlow.Api/Notes/CreateNoteRequest.cs`
- `tests/Solumada.PayFlow.Tests/Unit/NoteServiceTest.cs`
- `tests/Solumada.PayFlow.Tests/Slice/NotesControllerTest.cs`
- `tests/Solumada.PayFlow.Tests/Integration/NotesApiTest.cs`

Règles illustrées : **NET-001**, **NET-004**, **NET-005**, **NET-007**, **NET-008**, **CORE-012**, **CORE-014**, **CORE-015**

### Dépendances

**Autorisées sans discussion**

| Artefact | Rôle |
|---|---|
| `Microsoft.Extensions.*` | Injection de dépendances, configuration et journalisation, déjà dans le framework. |
| `System.Text.Json` | Le sérialiseur de la plateforme ; aucun autre n'est nécessaire. |

**Interdites**

| Artefact | Raison |
|---|---|
| `Microsoft.EntityFrameworkCore.InMemory` | Ce n'est pas une base relationnelle ; un test qui y passe ne prouve rien (CORE-021). |
| `Microsoft.AspNetCore.Mvc.NewtonsoftJson` | Un second sérialiseur aux réglages différents, pour un besoin que `System.Text.Json` couvre déjà. |

**Procédure pour ajouter une dépendance**

1. Vérifier les listes `allowed` et `forbidden` ci-dessus ; un paquet interdit n'est jamais ajouté.
2. Dire quelle couche en a besoin et pourquoi le framework ne couvre pas déjà ce besoin, puis attendre confirmation.
3. L'ajouter au seul projet qui l'utilise, avec une version explicite, jamais dans `Directory.Build.props`.
4. Commiter l'ajout seul (`build(deps)`), séparément du code qui l'utilise.

### Projets et références

Une flèche absente de ce tableau ne compile pas : la `ProjectReference` n'existe pas. Ajouter une référence pour contourner une règle est un changement d'architecture, pas un détail d'implémentation.

| Projet | Référence |
|---|---|
| `Solumada.PayFlow.Domain` | aucune |
| `Solumada.PayFlow.Application` | `Solumada.PayFlow.Domain` |
| `Solumada.PayFlow.Infrastructure` | `Solumada.PayFlow.Application`, `Solumada.PayFlow.Domain` |
| `Solumada.PayFlow.Api` | `Solumada.PayFlow.Application`, `Solumada.PayFlow.Domain`, `Solumada.PayFlow.Infrastructure` |
| `Solumada.PayFlow.Tests` | `Solumada.PayFlow.Api`, `Solumada.PayFlow.Application`, `Solumada.PayFlow.Domain`, `Solumada.PayFlow.Infrastructure` |

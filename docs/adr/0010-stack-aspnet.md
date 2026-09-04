# ADR 0010 — pack `aspnet` : ce que le compilateur tient, et ce qu'il reste à outiller

Date : 2026-09-03 · Statut : accepté

## Contexte

Troisième pack après `spring-boot` et `react`. Le choix s'est porté sur ASP.NET Core pour sa
symétrie avec le pack Spring : mêmes concepts (couches, migrations, tests d'intégration sur une
vraie base), donc un maximum de contenu déjà pensé et un minimum de couture nouvelle à ouvrir dans
le cœur.

La question décisive, posée à chaque candidat : **qu'est-ce qui joue le rôle d'ArchUnit ?** La
réponse est ici plus forte qu'ailleurs, et c'est elle qui structure le pack.

## Décision

### 1. Quatre projets, pas quatre dossiers

Le profil `layered` produit quatre `csproj` sous `src/`, plus un projet de tests sous `tests/` :

| Couche           | Projet                  | Référence                                 |
| ---------------- | ----------------------- | ----------------------------------------- |
| `domain`         | `<Root>.Domain`         | rien                                      |
| `application`    | `<Root>.Application`    | `Domain`                                  |
| `infrastructure` | `<Root>.Infrastructure` | `Application`, `Domain`                   |
| `api`            | `<Root>.Api`            | `Application`, `Domain`, `Infrastructure` |

Conséquence directe : **une frontière absente du graphe de références ne compile pas**. Le
compilateur C# tient trois règles que Spring doit confier à ArchUnit :

- `Domain` ne connaît ni EF Core, ni ASP.NET, ni aucune couche — il n'a aucune référence ;
- `Application` ne peut pas employer un type EF Core : le paquet n'est pas dans son graphe ;
- `Infrastructure` ne peut pas appeler un contrôleur.

D'où une valeur de `enforced_by` propre au pack : **`compiler`**. Elle n'exige pas de test — la
preuve est l'absence d'une `ProjectReference`, et la sanction est une erreur de build, pas un test
rouge. Le renderer la présente comme telle.

### 2. `Api → Infrastructure` reste autorisé, et c'est NetArchTest qui le borne

La racine de composition doit enregistrer le `DbContext` et les implémentations de dépôts : elle
nomme forcément des types d'`Infrastructure`. Prétendre le contraire imposerait un cinquième projet
d'amorçage, cérémonie que le pack refuse.

Donc `Api` référence `Infrastructure`, et la règle intéressante devient : **seule la racine de
composition peut nommer un type d'`Infrastructure`** (`NET-002`, `enforced_by: arch-test`). Un
contrôleur qui injecte un `DbContext` échoue au test, pas à la compilation.

NetArchTest garde aussi ce que le graphe de projets ne peut pas exprimer : un contrôleur expose un
DTO et jamais une entité, une entité de domaine n'a pas d'attribut de sérialisation, un dépôt est
`internal`.

### 3. Pas d'axe `migrations-*`

EF Core embarque ses migrations : l'axe à deux valeurs du pack Spring (Flyway ou Liquibase)
n'aurait qu'une valeur ici. Il disparaît, et `enforced_by: ef-migrations` porte la règle
« un changement de schéma passe par une migration, jamais par `EnsureCreated` ».

La migration initiale est **livrée dans le squelette**, snapshot compris : l'outil écrit des
fichiers, il n'exécute pas `dotnet ef`. Un snapshot qui ne correspondrait pas au modèle produirait
des diffs faux à la migration suivante ; la matrice de génération le vérifie en lançant
`dotnet ef migrations add Verify` et en exigeant une migration vide.

### 4. Un seul projet de tests, trois niveaux

Le `core/testing.yaml` commun impose trois niveaux et pas davantage. Ils deviennent trois dossiers
d'un même projet `<Root>.Tests`, distingués par `[Trait("Category", …)]` :

- `Unit` — xUnit seul, pas d'hôte ;
- `Slice` — `WebApplicationFactory` avec la couche `Application` doublée ;
- `Integration` — `WebApplicationFactory` + Testcontainers sur la vraie base.

Trois `csproj` de tests auraient été de la cérémonie ; le filtre `--filter Category!=Integration`
suffit à séparer ce qui a besoin de Docker.

**L'équivalent .NET de l'interdiction de H2 est l'interdiction du provider `InMemory`** — que
Microsoft déconseille lui-même — et de SQLite en mémoire pour tester du SQL. C'est la règle
`NET-021`.

### 5. Ce que le pack déclare

- **Version** : .NET 10 (LTS), épinglée par l'outil, jamais demandée — comme la version de Spring
  Boot.
- **`root_namespace`** joue le rôle de `base_package` : segments PascalCase, mots réservés C#
  refusés, cible d'une couche écrite `{{rootNamespace}}.Api`. Les noms de projets et de répertoires
  en dérivent.
- **Bases** : PostgreSQL (défaut, Npgsql), SQL Server, ou aucune — auquel cas le dépôt de l'exemple
  de référence est une liste en mémoire, comme côté Spring.
- **Options** : `security-none` | `security-cookie` | `security-jwt-bearer`, `docker`,
  `ci-github` | `ci-gitlab`, et le `git` commun.
- **`enforced_by`** : `compiler`, `arch-test`, `analyzer`, `format`, `ef-migrations`,
  `nuget-audit`, `commitlint`, `gitleaks`, `none`.
- **Skills** : les six du pack Spring, la symétrie étant réelle.

## Conséquences

- Le cœur ne bouge pas : le pack s'écrit avec les points d'extension ouverts pour `react`. Si l'un
  d'eux manque, c'est un défaut de découpage et il est ouvert explicitement, pas contourné.
- `enforced_by: compiler` est la première valeur outillée sans test associé.
  `testBackedEnforcers` ne contient donc que `arch-test`.
- La matrice de génération gagne un troisième axe de jobs : profil × sécurité × base, exécutée en
  `dotnet build` puis `dotnet test --filter Category!=Integration` hors PR avec Docker.
- Le profil `vertical-slice` (Minimal APIs découpées par feature) est le prochain candidat, une fois
  `layered` vérifié de bout en bout — même séquence que `spa-feature` puis `next-app`.

## Amendements

**2026-09-03, en écrivant le pack et en le vérifiant sur un vrai SDK.**

- **La valeur s'appelle `arch-test`, pas `netarchtest`.** NetArchTest n'inspecte pas les signatures
  de méthodes ni la valeur d'un attribut : deux règles du socle (`CORE-015`, la route versionnée) se
  vérifient par réflexion après une sélection NetArchTest. Nommer la valeur d'après la suite plutôt
  que d'après la bibliothèque évite de mentir dans la légende lue par l'agent.

- **L'axe des migrations ne disparaît pas complètement : il devient l'option `persistence-ef`,
  présente dès qu'une base est choisie.** Une règle de core ne peut pas être conditionnelle, or
  « le schéma évolue par migration » n'a aucun sens sans base. L'option porte donc les règles EF, le
  `DbContext`, la fabrique de conception et la fixture Testcontainers ; elle n'a pas de `group`,
  puisqu'il n'y a rien à choisir.

- **La migration initiale appartient au profil, pas à l'option.** Elle nomme l'entité de l'exemple
  de référence, qui est une donnée du profil. C'est l'inverse du pack Spring, où l'option Flyway
  écrit le SQL à partir de `it.tables` : ici la migration est du C# qui cite un type. La contrepartie
  est vérifiée, pas supposée — `dotnet ef migrations has-pending-model-changes` passe sur les deux
  providers, donc la migration et le snapshot écrits à la main décrivent exactement le modèle.

- **Trois contrats de pack, tenus par convention de nom plutôt que par référence croisée.** Le
  profil appelle `AddApiSecurity` / `UseApiSecurity`, que les trois options `security-*` fournissent
  toujours — y compris `security-none`, dont la version ne fait rien —, et `AddPersistence`, que
  l'option de persistance fournit dès qu'il y a une base. Aucun des deux axes ne nomme l'autre ; le
  point de rendez-vous est le vocabulaire du pack, comme l'est déjà `it.tables`.

- **Un quatrième rôle, `kernel`.** Le socle doit écrire les exceptions du domaine et l'enveloppe de
  pagination dans « le projet que tous les autres référencent » sans connaître les couches. Les
  rôles sont donc quatre : `kernel`, `host`, `persistence`, `tests`.

- **Un point d'extension ouvert dans le renderer `claude-code`.** Le skill `architecture` réservait
  ses sections au cœur et ignorait silencieusement celles du pack ; les deux s'additionnent
  désormais (`mergeExtras`). C'est le seul skill où le cœur et la stack ont chacun quelque chose à
  dire : les couches viennent du catalogue, le graphe de projets qui les tient appartient à .NET.

- **Deux pièges trouvés en exécutant, pas en relisant.** Sur un `record`, les attributs de
  validation doivent être portés par le paramètre du constructeur : `[property: Required]` est
  silencieusement ignoré et MVC lève une `InvalidOperationException` au premier appel — le squelette
  le documente à l'endroit exact. Et les projets ne sont pas frères, les tests vivant sous `tests/` :
  une `ProjectReference` en `../` ne résout pas, d'où `relativePath`.

**2026-09-04, en mettant `CLAUDE.md` à jour.**

- **Deux identifiants cités par cet ADR ne sont pas ceux du catalogue.** Ils ont été écrits avant le
  contenu, et le contenu a tranché autrement :
  - §2 annonce `NET-002` pour « seule la racine de composition nomme un type d'`Infrastructure` » ;
    la règle porte **`NET-003`**, `NET-002` étant devenue « `Application` ne référence ni
    `Infrastructure` ni EF Core ». Le découpage en trois règles de compilateur, et non deux, est
    venu de l'écriture du profil.
  - §4 annonce `NET-021` pour l'interdiction du provider `InMemory` ; la règle porte **`CORE-021`**
    et vit dans `content/aspnet/core/testing.yaml`. Elle vaut pour tout profil du pack, donc elle
    appartient au socle, et un identifiant de socle garde le préfixe `CORE-`. Le préfixe `NET-` est
    réservé à ce qu'un profil ajoute.

  Le corps de l'ADR n'est pas réécrit : il dit ce qui a été décidé, cet amendement dit où les règles
  ont atterri. Le catalogue reste la référence pour un identifiant.

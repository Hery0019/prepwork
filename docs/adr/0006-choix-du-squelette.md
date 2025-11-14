# ADR 0006 — Choix techniques du squelette généré

Date : 2026-09-02 · Statut : accepté

Décisions prises en écrivant les templates, non couvertes par CLAUDE.md.

## Spring Boot 4.1.1

Version épinglée dans `PINNED_VERSIONS` (CLAUDE.md §5 : jamais demandée). Conséquences dans les
templates : starters `spring-boot-starter-webmvc`, `-webmvc-test`, `-data-jpa-test`, `-flyway`,
`-liquibase` ; `@WebMvcTest` dans `org.springframework.boot.webmvc.test.autoconfigure` ;
`@DataJpaTest` dans `org.springframework.boot.data.jpa.test.autoconfigure` ; Testcontainers 2
(`org.testcontainers.postgresql.PostgreSQLContainer`…) ; `MockMvcTester` (AssertJ) pour les tests
web ; `@MockitoBean`.

## `common` : code transverse hors des couches

`ApiExceptionHandler`, `NotFoundException`, `ConflictException`, `PageResponse`, `CorsConfig` vivent
dans `<base>.common`, package plat, propriété du socle. Un profil peut en dépendre (le domaine
`layered` étend `NotFoundException`) ; `common` ne dépend d'aucune couche (LAY-011). Package plat
pour rester une API publique de module dans le profil `modular` (Spring Modulith).

## Sans base de données

`stack.database: none` reste un projet complet : `Note` sans JPA, `InMemoryNoteRepository` annoté
`@Repository`, `spring-boot-data-commons` pour `Pageable`/`Page` et leur résolution web, pas de
`@Transactional`, `NoteIT` sans Testcontainers. Vérifié par `mvn verify` complet.

## `security-none` = pas de Spring Security

Aucune dépendance Spring Security ; un test ArchUnit (SECN-003) interdit d'en ajouter à la main.
Les en-têtes de sécurité par défaut (CORE-034) ne s'appliquent donc qu'avec `session` ou
`oauth2-resource-server`, qui posent Spring Security. `.env.example` est un fichier d'équipe
(ADR 0004) : les valeurs saisies au questionnaire y sont écrites une seule fois.

## Formatage : palantir-java-format via Spotless, `check` lié à `verify`

Les templates sont écrits dans le style palantir ; le moteur trie les imports Java à la génération
(l'ordre dépend du package de base) et écrit les scripts `.cmd` en CRLF. Les constantes de package
des tests ArchUnit (`static final String BASE`) évitent les lignes dont la longueur dépendrait du
package choisi.

## Profil Spring `test` activé par Maven

Surefire et failsafe passent `spring.profiles.active=test` ; `src/test/resources/application-test.yaml`
reçoit les contributions `application_properties.test` des options (par exemple la désactivation
de l'authentification pour les slices). Les tests d'intégration sont nommés `*IT` (failsafe).

## Analyse des dépendances : Trivy

CORE-035 parle de « OWASP Dependency-Check ou équivalent » ; les pipelines générés utilisent Trivy
(scan du `pom.xml`, échec sur CRITICAL/HIGH), qui ne demande ni clé NVD ni base locale.

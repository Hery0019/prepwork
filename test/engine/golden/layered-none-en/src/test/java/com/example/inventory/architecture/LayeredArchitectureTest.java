package com.example.inventory.architecture;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.simpleNameEndingWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RestController;

/**
 * Rules of the layered profile. Each rule carries the LAY id it enforces; rule LAY_009 is built from the layers declared in the profile.
 */
@AnalyzeClasses(packages = LayeredArchitectureTest.BASE, importOptions = ImportOption.DoNotIncludeTests.class)
class LayeredArchitectureTest {

    static final String BASE = "com.example.inventory";
    private static final String WEB = "com.example.inventory.web..";
    private static final String SERVICE = "com.example.inventory.service..";
    private static final String REPOSITORY = "com.example.inventory.repository..";
    private static final String DOMAIN = "com.example.inventory.domain..";
    private static final String COMMON = BASE + ".common..";
    private static final String TRANSACTIONAL = "org.springframework.transaction.annotation.Transactional";
    private static final String JPA_ENTITY = "jakarta.persistence.Entity";

    @ArchTest
    static final ArchRule LAY_001_every_class_lives_in_a_layer_or_common = classes()
            .that()
            .resideInAPackage(BASE + "..")
            .and()
            .areNotAnnotatedWith(SpringBootApplication.class)
            .should()
            .resideInAnyPackage(WEB, SERVICE, REPOSITORY, DOMAIN, COMMON)
            .because("a class outside the layers escapes every architecture rule (LAY-001)");

    @ArchTest
    static final ArchRule LAY_002_web_does_not_depend_on_repository = noClasses()
            .that()
            .resideInAPackage(WEB)
            .should()
            .dependOnClassesThat()
            .resideInAPackage(REPOSITORY)
            .because("controllers must not bypass the service layer (LAY-002)");

    @ArchTest
    static final ArchRule LAY_003_domain_depends_on_no_layer_and_no_spring = noClasses()
            .that()
            .resideInAPackage(DOMAIN)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(WEB, SERVICE, REPOSITORY, "org.springframework..")
            .because("the domain must be readable and testable without the framework (LAY-003)");

    @ArchTest
    static final ArchRule LAY_004_repository_classes_are_interfaces_or_repositories = classes()
            .that()
            .resideInAPackage(REPOSITORY)
            .should()
            .beInterfaces()
            .orShould()
            .beAnnotatedWith(Repository.class)
            .because("persistence is a detail; business rules in queries are invisible to tests (LAY-004)");

    @ArchTest
    static final ArchRule LAY_005_transactional_classes_only_in_service = noClasses()
            .that()
            .resideOutsideOfPackage(SERVICE)
            .should()
            .beAnnotatedWith(TRANSACTIONAL)
            .because("the service is the unit of work (LAY-005)");

    @ArchTest
    static final ArchRule LAY_005_transactional_methods_only_in_service = noMethods()
            .that()
            .areDeclaredInClassesThat()
            .resideOutsideOfPackage(SERVICE)
            .should()
            .beAnnotatedWith(TRANSACTIONAL)
            .because("the service is the unit of work (LAY-005)");

    @ArchTest
    static final ArchRule LAY_007_request_and_response_dtos_are_records_in_web = classes()
            .that()
            .resideInAPackage(BASE + "..")
            .and()
            .resideOutsideOfPackage(COMMON)
            .and(simpleNameEndingWith("Request").or(simpleNameEndingWith("Response")))
            .should()
            .beRecords()
            .andShould()
            .resideInAPackage(WEB)
            .because("DTOs are immutable, explicit and impossible to confuse with an entity (LAY-007)");

    @ArchTest
    static final ArchRule LAY_008_entities_live_in_domain = classes()
            .that()
            .areAnnotatedWith(JPA_ENTITY)
            .should()
            .resideInAPackage(DOMAIN)
            .allowEmptyShould(true)
            .because("an entity annotated for the API is an entity that became the API (LAY-008)");

    @ArchTest
    static final ArchRule LAY_008_entities_carry_no_web_or_json_dependency = noClasses()
            .that()
            .areAnnotatedWith(JPA_ENTITY)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework.web..", "com.fasterxml.jackson..", "tools.jackson..")
            .allowEmptyShould(true)
            .because("an entity annotated for the API is an entity that became the API (LAY-008)");

    @ArchTest
    static final ArchRule LAY_009_dependencies_only_flow_downwards = layeredArchitecture()
            .consideringOnlyDependenciesInLayers()
            .layer("web")
            .definedBy(WEB)
            .layer("service")
            .definedBy(SERVICE)
            .layer("repository")
            .definedBy(REPOSITORY)
            .layer("domain")
            .definedBy(DOMAIN)
            .whereLayer("web")
            .mayOnlyAccessLayers("service", "domain")
            .whereLayer("service")
            .mayOnlyAccessLayers("repository", "domain")
            .whereLayer("repository")
            .mayOnlyAccessLayers("domain")
            .whereLayer("domain")
            .mayNotAccessAnyLayer()
            .because("the rule is the executable definition of the architecture (LAY-009)");

    @ArchTest
    static final ArchRule LAY_011_common_depends_on_no_layer = noClasses()
            .that()
            .resideInAPackage(COMMON)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(WEB, SERVICE, REPOSITORY, DOMAIN)
            .because("shared code that depends on a layer drags that layer everywhere (LAY-011)");

    @ArchTest
    static final ArchRule LAY_AP_001_controllers_never_inject_repositories = noClasses()
            .that()
            .areAnnotatedWith(RestController.class)
            .should()
            .dependOnClassesThat()
            .resideInAPackage(REPOSITORY)
            .because("transactions, validation and business rules would be bypassed (LAY-AP-001)");

    @ArchTest
    static final ArchRule LAY_AP_004_no_transactional_on_controllers_or_repositories = noClasses()
            .that()
            .areAnnotatedWith(RestController.class)
            .or()
            .areAnnotatedWith(Repository.class)
            .should()
            .beAnnotatedWith(TRANSACTIONAL)
            .because("the annotation belongs to the service method that forms the unit of work (LAY-AP-004)");
}

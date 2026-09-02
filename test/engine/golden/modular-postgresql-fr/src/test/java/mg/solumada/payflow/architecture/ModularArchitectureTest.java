package mg.solumada.payflow.architecture;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideOutsideOfPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

/**
 * Règles ArchUnit du profil modular, complémentaires de la vérification Modulith. Chaque règle porte l'identifiant MOD qu'elle outille.
 */
@AnalyzeClasses(packages = ModularArchitectureTest.BASE, importOptions = ImportOption.DoNotIncludeTests.class)
class ModularArchitectureTest {

    static final String BASE = "mg.solumada.payflow";
    private static final String COMMON = BASE + ".common..";
    private static final String INTERNAL = "..internal..";
    private static final String TRANSACTIONAL = "org.springframework.transaction.annotation.Transactional";
    private static final String JPA_ENTITY = "jakarta.persistence.Entity";

    @ArchTest
    static final ArchRule MOD_004_entities_stay_internal = classes()
            .that()
            .areAnnotatedWith(JPA_ENTITY)
            .should()
            .resideInAPackage(INTERNAL)
            .allowEmptyShould(true)
            .because("persistence is an implementation detail of a module (MOD-004)");

    @ArchTest
    static final ArchRule MOD_004_repositories_stay_internal = classes()
            .that()
            .areAnnotatedWith(Repository.class)
            .or()
            .areAssignableTo(org.springframework.data.repository.Repository.class)
            .should()
            .resideInAPackage(INTERNAL)
            .because("persistence is an implementation detail of a module (MOD-004)");

    @ArchTest
    static final ArchRule MOD_AP_004_controllers_stay_internal = classes()
            .that()
            .areAnnotatedWith(RestController.class)
            .should()
            .resideInAPackage(INTERNAL)
            .because("HTTP endpoints are never part of a module's API for other modules (MOD-004, MOD-AP-004)");

    @ArchTest
    static final ArchRule MOD_008_transactional_only_on_service_facades = noClasses()
            .that()
            .areNotAnnotatedWith(Service.class)
            .should()
            .beAnnotatedWith(TRANSACTIONAL)
            .because("the facade is the unit of work of the module (MOD-008)");

    @ArchTest
    static final ArchRule MOD_008_transactional_methods_only_on_service_facades = noMethods()
            .that()
            .areDeclaredInClassesThat()
            .areNotAnnotatedWith(Service.class)
            .should()
            .beAnnotatedWith(TRANSACTIONAL)
            .because("the facade is the unit of work of the module (MOD-008)");

    @ArchTest
    static final ArchRule MOD_009_common_depends_on_no_module = noClasses()
            .that()
            .resideInAPackage(COMMON)
            .should()
            .dependOnClassesThat(resideInAPackage(BASE + "..").and(resideOutsideOfPackage(COMMON)))
            .because("shared code that depends on a module drags that module everywhere (MOD-009)");
}

package mg.solumada.payflow.architecture;

import static com.tngtech.archunit.core.domain.properties.CanBeAnnotated.Predicates.annotatedWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import java.util.Arrays;
import java.util.stream.Stream;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Règles de base, indépendantes du profil d'architecture. Chaque règle porte l'identifiant de la règle CORE qu'elle outille.
 */
@AnalyzeClasses(packages = CoreArchitectureTest.BASE, importOptions = ImportOption.DoNotIncludeTests.class)
class CoreArchitectureTest {

    static final String BASE = "mg.solumada.payflow";
    private static final String JPA_ENTITY = "jakarta.persistence.Entity";

    @ArchTest
    static final ArchRule CORE_011_exactly_one_rest_controller_advice = classes()
            .that()
            .areAnnotatedWith(RestControllerAdvice.class)
            .should()
            .haveSimpleName("ApiExceptionHandler")
            .because("a single advice keeps status codes consistent (CORE-011)");

    @ArchTest
    static final ArchRule CORE_012_controllers_never_expose_entities = noMethods()
            .that()
            .areDeclaredInClassesThat()
            .areAnnotatedWith(RestController.class)
            .should()
            .haveRawReturnType(annotatedWith(JPA_ENTITY))
            .orShould()
            .haveRawParameterTypes(DescribedPredicate.<JavaClass>anyElementThat(annotatedWith(JPA_ENTITY)))
            .because("controllers expose DTOs, never entities (CORE-012)");

    @ArchTest
    static final ArchRule CORE_015_controllers_are_mapped_under_a_versioned_api = classes()
            .that()
            .areAnnotatedWith(RestController.class)
            .should(beMappedUnderVersionedApi())
            .because("every URL is versioned from day one (CORE-015)");

    @ArchTest
    static final ArchRule CORE_021_h2_is_never_used = noClasses()
            .should()
            .dependOnClassesThat()
            .resideInAPackage("org.h2..")
            .because("tests run on the real database through Testcontainers (CORE-021)");

    private static ArchCondition<JavaClass> beMappedUnderVersionedApi() {
        return new ArchCondition<>("be mapped under /api/v<n>/") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                boolean versioned = javaClass
                        .tryGetAnnotationOfType(RequestMapping.class)
                        .map(mapping -> Stream.concat(Arrays.stream(mapping.value()), Arrays.stream(mapping.path()))
                                .anyMatch(path -> path.matches("/api/v\\d+(/.*)?")))
                        .orElse(false);
                events.add(new SimpleConditionEvent(
                        javaClass, versioned, javaClass.getName() + " is not mapped under /api/v<n>/"));
            }
        };
    }
}

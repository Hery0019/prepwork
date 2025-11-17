package mg.solumada.payflow.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * Option security-none : Spring Security n'entre dans le projet qu'en changeant d'option dans scaffold.yaml.
 */
@AnalyzeClasses(packages = SecurityNoneArchitectureTest.BASE, importOptions = ImportOption.DoNotIncludeTests.class)
class SecurityNoneArchitectureTest {

    static final String BASE = "mg.solumada.payflow";

    @ArchTest
    static final ArchRule SECN_003_no_hand_made_spring_security = noClasses()
            .should()
            .dependOnClassesThat()
            .resideInAPackage("org.springframework.security..")
            .because("Spring Security is added by switching the security option, never by hand (SECN-003)");
}

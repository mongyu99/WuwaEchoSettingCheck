package com.wuwaecho.backend;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.junit.jupiter.api.Tag;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * 실제 Postgres(wuwaecho_test DB)가 필요한 통합 테스트입니다. ./gradlew test 에서는 빠지고
 * ./gradlew integrationTest 로 실행합니다.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Tag("integration")
@SpringBootTest
@ActiveProfiles("test")
public @interface IntegrationTest {
}

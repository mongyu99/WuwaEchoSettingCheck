package com.wuwaecho.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.jsonwebtoken.security.WeakKeyException;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "test-secret-at-least-32-bytes-long-0123456789"; // gitleaks:allow

    private final JwtService jwtService = new JwtService(new JwtProperties(SECRET, 60));

    @Test
    void issuedTokenParsesBackToSameUserId() {
        String token = jwtService.issue(42L);

        assertThat(jwtService.parseUserId(token)).contains(42L);
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = jwtService.issue(42L);
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("AA") ? "BB" : "AA");

        assertThat(jwtService.parseUserId(tampered)).isEmpty();
    }

    @Test
    void tokenSignedWithDifferentSecretIsRejected() {
        JwtService other = new JwtService(new JwtProperties("another-secret-at-least-32-bytes-long-xyz", 60));

        assertThat(jwtService.parseUserId(other.issue(42L))).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService alreadyExpired = new JwtService(new JwtProperties(SECRET, -1));

        assertThat(jwtService.parseUserId(alreadyExpired.issue(42L))).isEmpty();
    }

    @Test
    void garbageIsRejected() {
        assertThat(jwtService.parseUserId("not-a-jwt")).isEmpty();
        assertThat(jwtService.parseUserId("")).isEmpty();
    }

    @Test
    void secretShorterThan32BytesFailsAtStartup() {
        assertThatThrownBy(() -> new JwtService(new JwtProperties("too-short", 60)))
                .isInstanceOf(WeakKeyException.class);
    }
}

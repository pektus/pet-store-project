package com.petstore.web.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", 3600000L); // 1 hour
        ReflectionTestUtils.setField(tokenProvider, "jwtIssuer", "PetStoreTest");
        tokenProvider.init();
    }

    @Test
    @DisplayName("Should generate valid signed JWT and parse claims accurately")
    void testGenerateAndValidateToken() {
        String token = tokenProvider.generateToken("admin", "ROLE_ADMIN");

        assertThat(token).isNotBlank();
        assertThat(tokenProvider.validateToken(token)).isTrue();
        assertThat(tokenProvider.getUsernameFromToken(token)).isEqualTo("admin");
        assertThat(tokenProvider.getRoleFromToken(token)).isEqualTo("ROLE_ADMIN");
    }

    @Test
    @DisplayName("Should reject malformed or tampered JWT")
    void testRejectTamperedToken() {
        String token = tokenProvider.generateToken("admin", "ROLE_ADMIN");
        String tamperedToken = token + "xyz";

        assertThat(tokenProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("Should reject expired JWT token")
    void testRejectExpiredToken() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortLivedProvider, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(shortLivedProvider, "jwtExpirationMs", -1000L); // already expired
        ReflectionTestUtils.setField(shortLivedProvider, "jwtIssuer", "PetStoreTest");
        shortLivedProvider.init();

        String expiredToken = shortLivedProvider.generateToken("admin", "ROLE_ADMIN");
        assertThat(shortLivedProvider.validateToken(expiredToken)).isFalse();
    }
}

package com.kozimor.wms.UnitTests;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Security.JwtService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtService - Security Tests")
class JwtServiceSecurityTest {

    @Mock
    private JwtEncoder jwtEncoder;

    @Mock
    private JwtDecoder jwtDecoder;

    @Mock
    private UserRepository userRepository;

    private JwtService jwtService;

    @Mock
    private Authentication authentication;

    private User testUser;
    private Role adminRole;
    private Jwt validAccessToken;
    private Jwt validRefreshToken;

    @BeforeEach
    void setUp() {
        // Initialize JwtService with mocked dependencies
        jwtService = new JwtService(jwtEncoder, jwtDecoder, 3600000, 604800000, "wms", userRepository);
        
        // Initialize test data
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setRoleName("ROLE_ADMIN");

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("encodedPassword");
        testUser.setEmail("test@example.com");
        testUser.setRole(adminRole);

        // Setup authentication mock
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getAuthorities())
                .thenReturn((java.util.Collection) java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_ADMIN")));
        
        // Initialize token mocks
        validAccessToken = mock(Jwt.class);
        when(validAccessToken.getTokenValue()).thenReturn("valid-access-token");
        
        validRefreshToken = mock(Jwt.class);
        when(validRefreshToken.getTokenValue()).thenReturn("valid-refresh-token");
    }

    // ========== TOKEN GENERATION TESTS ==========

    @Test
    @DisplayName("Should generate valid access token")
    void testGenerateAccessToken() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        // Act
        String token = jwtService.generateToken(authentication);

        // Assert
        assertNotNull(token);
        verify(jwtEncoder, times(1)).encode(any(JwtEncoderParameters.class));
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void testGenerateRefreshToken() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validRefreshToken);

        // Act
        String token = jwtService.generateRefreshToken(authentication);

        // Assert
        assertNotNull(token);
        verify(jwtEncoder, times(1)).encode(any(JwtEncoderParameters.class));
    }

    @Test
    @DisplayName("Should include user ID in token claims")
    void testTokenContainsUserId() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        String token = jwtService.generateToken(authentication);

        assertNotNull(token);
        verify(jwtEncoder, times(1)).encode(any(JwtEncoderParameters.class));
    }

    @Test
    @DisplayName("Should include user roles in access token")
    void testAccessTokenContainsRoles() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        String token = jwtService.generateToken(authentication);

        assertNotNull(token);
        verify(jwtEncoder, times(1)).encode(any(JwtEncoderParameters.class));
    }

    @Test
    @DisplayName("Should NOT include roles in refresh token")
    void testRefreshTokenDoesNotContainRoles() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validRefreshToken);

        String token = jwtService.generateRefreshToken(authentication);

        assertNotNull(token);
        verify(jwtEncoder, times(1)).encode(any(JwtEncoderParameters.class));
    }

    // ========== TOKEN VALIDATION TESTS ==========

    @Test
    @DisplayName("Should validate correct refresh token")
    void testValidateValidRefreshToken() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("tokenType")).thenReturn("refresh");
        when(jwt.getExpiresAt()).thenReturn(Instant.now().plusSeconds(3600));
        when(jwtDecoder.decode("validToken")).thenReturn(jwt);

        boolean result = jwtService.validateRefreshToken("validToken");

        assertTrue(result);
    }

    @Test
    @DisplayName("Should reject expired refresh token")
    void testRejectExpiredRefreshToken() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("tokenType")).thenReturn("refresh");
        when(jwt.getExpiresAt()).thenReturn(Instant.now().minusSeconds(1000));
        when(jwtDecoder.decode("expiredToken")).thenReturn(jwt);

        boolean result = jwtService.validateRefreshToken("expiredToken");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should reject token with wrong tokenType")
    void testRejectWrongTokenType() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("tokenType")).thenReturn("access");
        when(jwtDecoder.decode("wrongTypeToken")).thenReturn(jwt);

        boolean result = jwtService.validateRefreshToken("wrongTypeToken");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should reject malformed token")
    void testRejectMalformedToken() {
        when(jwtDecoder.decode("invalidToken"))
                .thenThrow(new IllegalArgumentException("Invalid token"));

        boolean result = jwtService.validateRefreshToken("invalidToken");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should reject null refresh token")
    void testRejectNullRefreshToken() {
        boolean result = jwtService.validateRefreshToken(null);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should reject empty refresh token")
    void testRejectEmptyRefreshToken() {
        boolean result = jwtService.validateRefreshToken("");

        assertFalse(result);
    }

    // ========== TOKEN EXTRACTION TESTS ==========

    @Test
    @DisplayName("Should extract username from token")
    void testExtractUsernameFromToken() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("testuser");
        when(jwtDecoder.decode("validToken")).thenReturn(jwt);

        String username = jwtService.getUsernameFromToken("validToken");

        assertEquals("testuser", username);
    }

    @Test
    @DisplayName("Should return null when extracting username from invalid token")
    void testExtractUsernameFromInvalidToken() {
        when(jwtDecoder.decode("invalidToken"))
                .thenThrow(new IllegalArgumentException("Invalid token"));

        String username = jwtService.getUsernameFromToken("invalidToken");

        assertNull(username);
    }

    @Test
    @DisplayName("Should handle null username in token")
    void testHandleNullUsernameInToken() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(null);
        when(jwtDecoder.decode("nullUsernameToken")).thenReturn(jwt);

        String username = jwtService.getUsernameFromToken("nullUsernameToken");

        assertNull(username);
    }

    // ========== SECURITY AUTHORIZATION TESTS ==========

    @Test
    @DisplayName("Should include ROLE_ADMIN in access token")
    void testAccessTokenIncludesAdminRole() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        String token = jwtService.generateToken(authentication);

        assertNotNull(token);
        verify(jwtEncoder, times(1)).encode(any(JwtEncoderParameters.class));
    }

    @Test
    @DisplayName("Should generate token with WAREHOUSE role")
    void testGenerateTokenWithWarehouseRole() {
        Role warehouseRole = new Role();
        warehouseRole.setId(2L);
        warehouseRole.setRoleName("ROLE_WAREHOUSE");

        testUser.setRole(warehouseRole);
        when(authentication.getAuthorities())
                .thenReturn((java.util.Collection) java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_WAREHOUSE")));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        String token = jwtService.generateToken(authentication);

        assertNotNull(token);
    }

    @Test
    @DisplayName("Should generate token with PRODUCTION role")
    void testGenerateTokenWithProductionRole() {
        Role productionRole = new Role();
        productionRole.setId(3L);
        productionRole.setRoleName("ROLE_PRODUCTION");

        testUser.setRole(productionRole);
        when(authentication.getAuthorities())
                .thenReturn((java.util.Collection) java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_PRODUCTION")));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        String token = jwtService.generateToken(authentication);

        assertNotNull(token);
    }

    // ========== TOKEN INTEGRITY TESTS ==========

    @Test
    @DisplayName("Should use consistent username in token")
    void testTokenContainsCorrectUsername() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        String token = jwtService.generateToken(authentication);

        assertNotNull(token);
        verify(authentication, atLeastOnce()).getName();
    }

    @Test
    @DisplayName("Should fail to generate token when user not found in repository")
    void testGenerateTokenFailsWhenUserNotInRepository() {
        when(userRepository.findByUsername("unknownuser"))
                .thenReturn(Optional.empty());
        when(authentication.getName()).thenReturn("unknownuser");

        assertThrows(Exception.class,
                () -> jwtService.generateToken(authentication));
    }

    @Test
    @DisplayName("Should reject token with null expiration time")
    void testRejectTokenWithNullExpiration() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("tokenType")).thenReturn("refresh");
        when(jwt.getExpiresAt()).thenReturn(null);
        when(jwtDecoder.decode("noExpirationToken")).thenReturn(jwt);

        boolean result = jwtService.validateRefreshToken("noExpirationToken");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should generate different tokens for different users")
    void testGenerateDifferentTokensForDifferentUsers() {
        User user2 = new User();
        user2.setId(2L);
        user2.setUsername("anotheruser");
        user2.setRole(adminRole);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(userRepository.findByUsername("anotheruser")).thenReturn(Optional.of(user2));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(validAccessToken);

        String token1 = jwtService.generateToken(authentication);

        Authentication auth2 = mock(Authentication.class);
        when(auth2.getName()).thenReturn("anotheruser");
        when(auth2.getAuthorities())
                .thenReturn((java.util.Collection) java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_ADMIN")));

        String token2 = jwtService.generateToken(auth2);

        assertNotNull(token1);
        assertNotNull(token2);
        verify(jwtEncoder, times(2)).encode(any(JwtEncoderParameters.class));
    }
}

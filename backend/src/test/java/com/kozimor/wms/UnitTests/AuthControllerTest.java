package com.kozimor.wms.UnitTests;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import com.kozimor.wms.Config.SecurityConfig;
import com.kozimor.wms.Database.Controller.AuthController;
import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.RoleRepository;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Database.Service.UserIDGenerator;
import com.kozimor.wms.Security.JwtService;

import java.util.Optional;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@DisplayName("AuthController - Security & API Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthenticationManager authenticationManager;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private RoleRepository roleRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private UserIDGenerator userIDGenerator;


    private User testUser;
    private Role adminRole;
    private String validAccessToken;
    private String validRefreshToken;

    @BeforeEach
    void setUp() {
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setRoleName("ROLE_ADMIN");

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("hashedPassword");
        testUser.setEmail("test@example.com");
        testUser.setRole(adminRole);

        validAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.accessToken";
        validRefreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshToken";
    }

    // ========== LOGIN ENDPOINT TESTS ==========

    @Test
    @DisplayName("POST /api/auth/login - Should login successfully with valid credentials")
    void testLoginWithValidCredentials() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "testuser",
                "password",
                java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        when(authenticationManager.authenticate(any()))
                .thenReturn(auth);
        when(jwtService.generateToken(auth))
                .thenReturn(validAccessToken);
        when(jwtService.generateRefreshToken(auth))
                .thenReturn(validRefreshToken);

        String loginRequest = "{\"username\":\"testuser\",\"password\":\"password\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.expiresInMs").exists());

        verify(authenticationManager, times(1)).authenticate(any());
        verify(jwtService, times(1)).generateToken(any());
        verify(jwtService, times(1)).generateRefreshToken(any());
    }

    @Test
    @DisplayName("POST /api/auth/login - Should reject login with invalid credentials")
    void testLoginWithInvalidCredentials() throws Exception {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        String loginRequest = "{\"username\":\"testuser\",\"password\":\"wrongpassword\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isUnauthorized());

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("POST /api/auth/login - Should reject empty username")
    void testLoginWithEmptyUsername() throws Exception {
        String loginRequest = "{\"username\":\"\",\"password\":\"password\"}";

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login - Should reject empty password")
    void testLoginWithEmptyPassword() throws Exception {
        String loginRequest = "{\"username\":\"testuser\",\"password\":\"\"}";

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login - Should return token expiration times")
    void testLoginReturnsExpirationTimes() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "testuser",
                "password",
                java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        when(authenticationManager.authenticate(any()))
                .thenReturn(auth);
        when(jwtService.generateToken(auth))
                .thenReturn(validAccessToken);
        when(jwtService.generateRefreshToken(auth))
                .thenReturn(validRefreshToken);

        String loginRequest = "{\"username\":\"testuser\",\"password\":\"password\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expiresInMs").exists())
                .andExpect(jsonPath("$.refreshExpiresInMs").exists());
    }

    // ========== REFRESH TOKEN ENDPOINT TESTS ==========

    @Test
    @DisplayName("POST /api/auth/refresh - Should refresh token with valid refresh token")
    void testRefreshTokenWithValidToken() throws Exception {
        when(jwtService.validateRefreshToken(validRefreshToken))
                .thenReturn(true);
        when(jwtService.getUsernameFromToken(validRefreshToken))
                .thenReturn("testuser");
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(any()))
                .thenReturn(validAccessToken);

        String refreshRequest = "{\"refreshToken\":\"" + validRefreshToken + "\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.expiresInMs").exists());

        verify(jwtService, times(1)).validateRefreshToken(validRefreshToken);
        verify(jwtService, times(1)).generateToken(any());
    }

    @Test
    @DisplayName("POST /api/auth/refresh - Should reject with invalid refresh token")
    void testRefreshTokenWithInvalidToken() throws Exception {
        when(jwtService.validateRefreshToken("invalidToken"))
                .thenReturn(false);

        String refreshRequest = "{\"refreshToken\":\"invalidToken\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isUnauthorized());

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("POST /api/auth/refresh - Should reject with expired refresh token")
    void testRefreshTokenWithExpiredToken() throws Exception {
        when(jwtService.validateRefreshToken("expiredToken"))
                .thenReturn(false);

        String refreshRequest = "{\"refreshToken\":\"expiredToken\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$").isString());
    }

    @Test
    @DisplayName("POST /api/auth/refresh - Should reject empty refresh token")
    void testRefreshTokenWithEmptyToken() throws Exception {
        String refreshRequest = "{\"refreshToken\":\"\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/refresh - Should reject null refresh token")
    void testRefreshTokenWithNullToken() throws Exception {
        String refreshRequest = "{\"refreshToken\":null}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/refresh - Should reject when user not found")
    void testRefreshTokenWhenUserNotFound() throws Exception {
        when(jwtService.validateRefreshToken(validRefreshToken))
                .thenReturn(true);
        when(jwtService.getUsernameFromToken(validRefreshToken))
                .thenReturn("unknownuser");
        when(userRepository.findByUsername("unknownuser"))
                .thenReturn(Optional.empty());

        String refreshRequest = "{\"refreshToken\":\"" + validRefreshToken + "\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isUnauthorized());
    }

    // ========== SECURITY AUTHORIZATION TESTS ==========

    @Test
    @DisplayName("POST /api/auth/login - Should preserve user role in authentication")
    void testLoginPreservesUserRole() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "testuser",
                "password",
                java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        when(authenticationManager.authenticate(any()))
                .thenReturn(auth);
        when(jwtService.generateToken(auth))
                .thenReturn(validAccessToken);
        when(jwtService.generateRefreshToken(auth))
                .thenReturn(validRefreshToken);

        String loginRequest = "{\"username\":\"testuser\",\"password\":\"password\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        verify(jwtService, times(1)).generateToken(auth);
    }

    @Test
    @DisplayName("POST /api/auth/refresh - Should maintain role after refresh")
    void testRefreshTokenMaintainsRole() throws Exception {
        when(jwtService.validateRefreshToken(validRefreshToken))
                .thenReturn(true);
        when(jwtService.getUsernameFromToken(validRefreshToken))
                .thenReturn("testuser");
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(any()))
                .thenReturn(validAccessToken);

        String refreshRequest = "{\"refreshToken\":\"" + validRefreshToken + "\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isOk());

        verify(userRepository, times(1)).findByUsername("testuser");
    }

    @Test
    @DisplayName("POST /api/auth/login - Should handle WAREHOUSE role login")
    void testLoginWithWarehouseRole() throws Exception {
        Role warehouseRole = new Role();
        warehouseRole.setId(2L);
        warehouseRole.setRoleName("ROLE_WAREHOUSE");

        User warehouseUser = new User();
        warehouseUser.setId(2L);
        warehouseUser.setUsername("warehouse_user");
        warehouseUser.setRole(warehouseRole);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "warehouse_user",
                "password",
                java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_WAREHOUSE"))
        );

        when(authenticationManager.authenticate(any()))
                .thenReturn(auth);
        when(jwtService.generateToken(auth))
                .thenReturn(validAccessToken);
        when(jwtService.generateRefreshToken(auth))
                .thenReturn(validRefreshToken);

        String loginRequest = "{\"username\":\"warehouse_user\",\"password\":\"password\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/login - Should handle PRODUCTION role login")
    void testLoginWithProductionRole() throws Exception {
        Role productionRole = new Role();
        productionRole.setId(3L);
        productionRole.setRoleName("ROLE_PRODUCTION");

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "production_user",
                "password",
                java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_PRODUCTION"))
        );

        when(authenticationManager.authenticate(any()))
                .thenReturn(auth);
        when(jwtService.generateToken(auth))
                .thenReturn(validAccessToken);
        when(jwtService.generateRefreshToken(auth))
                .thenReturn(validRefreshToken);

        String loginRequest = "{\"username\":\"production_user\",\"password\":\"password\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    // ========== TOKEN FORMAT TESTS ==========

    @Test
    @DisplayName("POST /api/auth/login - Should return properly formatted response")
    void testLoginResponseFormat() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "testuser",
                "password",
                java.util.Arrays.asList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        when(authenticationManager.authenticate(any()))
                .thenReturn(auth);
        when(jwtService.generateToken(auth))
                .thenReturn(validAccessToken);
        when(jwtService.generateRefreshToken(auth))
                .thenReturn(validRefreshToken);

        String loginRequest = "{\"username\":\"testuser\",\"password\":\"password\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.expiresInMs").exists())
                .andExpect(jsonPath("$.refreshExpiresInMs").exists());
    }

    @Test
    @DisplayName("POST /api/auth/refresh - Should return access token only on refresh")
    void testRefreshResponseFormat() throws Exception {
        when(jwtService.validateRefreshToken(validRefreshToken))
                .thenReturn(true);
        when(jwtService.getUsernameFromToken(validRefreshToken))
                .thenReturn("testuser");
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(any()))
                .thenReturn(validAccessToken);

        String refreshRequest = "{\"refreshToken\":\"" + validRefreshToken + "\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.expiresInMs").isNumber())
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }
}

package com.kozimor.wms.UnitTests;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Security.CustomUserDetailsService;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService - Unit Tests")
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    private User testUser;
    private Role adminRole;
    private Role warehouseRole;
    private Role productionRole;

    @BeforeEach
    void setUp() {
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setRoleName("ROLE_ADMIN");

        warehouseRole = new Role();
        warehouseRole.setId(2L);
        warehouseRole.setRoleName("ROLE_WAREHOUSE");

        productionRole = new Role();
        productionRole.setId(3L);
        productionRole.setRoleName("ROLE_PRODUCTION");

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("hashedPassword123");
        testUser.setEmail("test@example.com");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmployeeId("EMP001");
        testUser.setRole(adminRole);
    }

    // ========== LOAD USER BY USERNAME TESTS ==========

    @Test
    @DisplayName("Should load user by username successfully")
    void testLoadUserByUsernameSuccess() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals("hashedPassword123", result.getPassword());
        verify(userRepository, times(1)).findByUsername("testuser");
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user not found")
    void testLoadUserByUsernameNotFound() {
        when(userRepository.findByUsername("nonexistent"))
                .thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("nonexistent"));

        assertTrue(exception.getMessage().contains("nonexistent"));
        verify(userRepository, times(1)).findByUsername("nonexistent");
    }

    @Test
    @DisplayName("Should include exact error message with username in exception")
    void testExceptionMessageIncludesUsername() {
        String username = "unknownuser";
        when(userRepository.findByUsername(username))
                .thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername(username));

        assertEquals("User not found: " + username, exception.getMessage());
    }

    // ========== AUTHORITIES TESTS ==========

    @Test
    @DisplayName("Should load user with ROLE_ADMIN authority")
    void testLoadUserWithAdminRole() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
        assertEquals(1, result.getAuthorities().size());
    }

    @Test
    @DisplayName("Should load user with ROLE_WAREHOUSE authority")
    void testLoadUserWithWarehouseRole() {
        testUser.setRole(warehouseRole);
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_WAREHOUSE")));
        assertEquals(1, result.getAuthorities().size());
    }

    @Test
    @DisplayName("Should load user with ROLE_PRODUCTION authority")
    void testLoadUserWithProductionRole() {
        testUser.setRole(productionRole);
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PRODUCTION")));
        assertEquals(1, result.getAuthorities().size());
    }

    @Test
    @DisplayName("Should load user with exactly one authority")
    void testLoadUserHasExactlyOneAuthority() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertEquals(1, result.getAuthorities().size());
    }

    @Test
    @DisplayName("Should load user with authority of type SimpleGrantedAuthority")
    void testAuthorityIsSimpleGrantedAuthority() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.getAuthorities().stream()
                .allMatch(a -> a instanceof SimpleGrantedAuthority));
    }

    // ========== NULL ROLE TESTS ==========

    @Test
    @DisplayName("Should load user with null role - empty authorities")
    void testLoadUserWithNullRole() {
        testUser.setRole(null);
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertTrue(result.getAuthorities().isEmpty());
    }

    // ========== ACCOUNT STATUS TESTS ==========

    @Test
    @DisplayName("Should have account as non-expired")
    void testAccountNonExpired() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.isAccountNonExpired());
    }

    @Test
    @DisplayName("Should have account as non-locked")
    void testAccountNonLocked() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.isAccountNonLocked());
    }

    @Test
    @DisplayName("Should have credentials as non-expired")
    void testCredentialsNonExpired() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.isCredentialsNonExpired());
    }

    @Test
    @DisplayName("Should have account as enabled")
    void testAccountEnabled() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.isEnabled());
    }

    @Test
    @DisplayName("Should have all account status flags as true")
    void testAllAccountStatusFlagsTrue() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.isAccountNonExpired());
        assertTrue(result.isAccountNonLocked());
        assertTrue(result.isCredentialsNonExpired());
        assertTrue(result.isEnabled());
    }

    // ========== PASSWORD AND USERNAME TESTS ==========

    @Test
    @DisplayName("Should preserve password during user details loading")
    void testPasswordPreserved() {
        String password = "encodedPassword123!@#";
        testUser.setPassword(password);
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertEquals(password, result.getPassword());
    }

    @Test
    @DisplayName("Should preserve username during user details loading")
    void testUsernamePreserved() {
        String username = "myusername";
        testUser.setUsername(username);
        when(userRepository.findByUsername(username))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername(username);

        assertEquals(username, result.getUsername());
    }

    // ========== REPOSITORY INTERACTION TESTS ==========

    @Test
    @DisplayName("Should call repository exactly once")
    void testRepositoryCalledOnce() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        userDetailsService.loadUserByUsername("testuser");

        verify(userRepository, times(1)).findByUsername("testuser");
    }

    // ========== SECURITY AUTHORIZATION TESTS ==========

    @Test
    @DisplayName("Should verify user with ROLE_ADMIN can authenticate")
    void testRoleAdminAuthentication() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("Should verify user with ROLE_WAREHOUSE can authenticate")
    void testRoleWarehouseAuthentication() {
        testUser.setRole(warehouseRole);
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_WAREHOUSE")));
    }

    @Test
    @DisplayName("Should verify user with ROLE_PRODUCTION can authenticate")
    void testRoleProductionAuthentication() {
        testUser.setRole(productionRole);
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PRODUCTION")));
    }

    @Test
    @DisplayName("Should have exactly one authority per user")
    void testExactlyOneAuthority() {
        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(testUser));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertEquals(1, result.getAuthorities().size());
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException for unauthorized access attempt")
    void testUnauthorizedAccessThrowsException() {
        when(userRepository.findByUsername("hacker"))
                .thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("hacker"));

        assertFalse(exception.getMessage().isBlank());
    }

}

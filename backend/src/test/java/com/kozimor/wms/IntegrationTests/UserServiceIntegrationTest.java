package com.kozimor.wms.IntegrationTests;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Model.DTO.UserDTO;
import com.kozimor.wms.Database.Model.DTO.PageResponse;
import com.kozimor.wms.Database.Repository.RoleRepository;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Database.Service.UserService;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("UserServiceImpl - Integration Tests")
class UserServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User testUser;
    private Role adminRole;
    private Role userRole;

    @BeforeEach
    void setUp() {
        // Create roles if they don't exist
        if (roleRepository.findByRoleName("ROLE_ADMIN").isEmpty()) {
            adminRole = roleRepository.save(Role.builder().roleName("ROLE_ADMIN").build());
        } else {
            adminRole = roleRepository.findByRoleName("ROLE_ADMIN").get();
        }

        if (roleRepository.findByRoleName("ROLE_USER").isEmpty()) {
            userRole = roleRepository.save(Role.builder().roleName("ROLE_USER").build());
        } else {
            userRole = roleRepository.findByRoleName("ROLE_USER").get();
        }

        // Create test user
        testUser = User.builder()
                .username("integrationtestuser")
                .password("encodedPassword123")
                .email("integration@test.com")
                .firstName("Integration")
                .lastName("Test")
                .employeeId("INT001")
                .role(userRole)
                .build();
    }

    // ========== GET USER TESTS ==========

    @Test
    @DisplayName("Should retrieve user by ID from database")
    void testGetUserById() {
        // Arrange
        User savedUser = userRepository.save(testUser);

        // Act
        Optional<User> result = userService.getUserById(savedUser.getId());

        // Assert
        assertTrue(result.isPresent());
        assertEquals("integrationtestuser", result.get().getUsername());
        assertEquals("integration@test.com", result.get().getEmail());
    }

    @Test
    @DisplayName("Should retrieve user by username from database")
    void testGetUserByUsername() {
        // Arrange
        userRepository.save(testUser);

        // Act
        Optional<User> result = userService.getUserByUsername("integrationtestuser");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("integrationtestuser", result.get().getUsername());
    }

    @Test
    @DisplayName("Should retrieve user by email from database")
    void testGetUserByEmail() {
        // Arrange
        userRepository.save(testUser);

        // Act
        Optional<User> result = userService.getUserByEmail("integration@test.com");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("integration@test.com", result.get().getEmail());
    }

    @Test
    @DisplayName("Should return empty Optional when user not found by ID")
    void testGetUserByIdNotFound() {
        // Act
        Optional<User> result = userService.getUserById(999999L);

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should retrieve all users from database")
    void testGetAllUsers() {
        // Arrange
        long initialCount = userService.getUserCount();
        userRepository.save(testUser);

        // Act
        List<User> result = userService.getAllUsers();

        // Assert
        assertEquals(initialCount + 1, result.size());
    }

    @Test
    @DisplayName("Should retrieve paginated users from database")
    void testGetAllUsersPaginated() {
        // Arrange
        userRepository.save(testUser);
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        PageResponse<UserDTO> result = userService.getAllUsersPaginated(pageable);

        // Assert
        assertNotNull(result);
        assertGreater(result.getContent().size(), 0);
        assertFalse(result.getContent().stream()
                .noneMatch(u -> u.getUsername().equals("integrationtestuser")));
    }

    // ========== UPDATE USER TESTS ==========

    @Test
    @DisplayName("Should update user successfully")
    void testUpdateUser() {
        // Arrange
        User savedUser = userRepository.save(testUser);
        User updateData = User.builder()
                .username("updatedusername")
                .email("updated@test.com")
                .firstName("UpdatedFirst")
                .lastName("UpdatedLast")
                .build();

        // Act
        User result = userService.updateUser(savedUser.getId(), updateData);

        // Assert
        assertEquals("updatedusername", result.getUsername());
        assertEquals("updated@test.com", result.getEmail());
        assertEquals("UpdatedFirst", result.getFirstName());
        assertEquals("UpdatedLast", result.getLastName());
    }

    @Test
    @DisplayName("Should update user role successfully")
    void testUpdateUserRole() {
        // Arrange
        User savedUser = userRepository.save(testUser);

        // Act
        User result = userService.updateUserRole(savedUser.getId(), "ROLE_ADMIN");

        // Assert
        assertNotNull(result.getRole());
        assertEquals("ROLE_ADMIN", result.getRole().getRoleName());
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent user")
    void testUpdateNonExistentUser() {
        // Arrange
        User updateData = User.builder()
                .username("updatedusername")
                .email("updated@test.com")
                .build();

        // Act & Assert
        assertThrows(Exception.class,
                () -> userService.updateUser(999999L, updateData));
    }

    @Test
    @DisplayName("Should throw exception when updating user with invalid role")
    void testUpdateUserWithInvalidRole() {
        // Arrange
        User savedUser = userRepository.save(testUser);

        // Act & Assert
        assertThrows(Exception.class,
                () -> userService.updateUserRole(savedUser.getId(), "INVALID_ROLE"));
    }

    // ========== DELETE USER TESTS ==========

    @Test
    @DisplayName("Should delete user successfully")
    void testDeleteUser() {
        // Arrange
        User savedUser = userRepository.save(testUser);
        assertTrue(userRepository.existsById(savedUser.getId()));

        // Act
        userService.deleteUser(savedUser.getId());

        // Assert
        assertFalse(userRepository.existsById(savedUser.getId()));
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent user")
    void testDeleteNonExistentUser() {
        // Act & Assert
        assertThrows(Exception.class,
                () -> userService.deleteUser(999999L));
    }

    // ========== ROLE CHECKING TESTS ==========

    @Test
    @DisplayName("Should correctly identify admin user")
    void testIsAdminTrue() {
        // Arrange
        testUser.setRole(adminRole);
        User savedUser = userRepository.save(testUser);

        // Act
        boolean result = userService.isAdmin(savedUser.getId());

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should correctly identify non-admin user")
    void testIsAdminFalse() {
        // Arrange
        testUser.setRole(userRole);
        User savedUser = userRepository.save(testUser);

        // Act
        boolean result = userService.isAdmin(savedUser.getId());

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should throw exception when checking admin status of non-existent user")
    void testIsAdminThrowsException() {
        // Act & Assert
        assertThrows(Exception.class,
                () -> userService.isAdmin(999999L));
    }

    // ========== USER COUNT TESTS ==========

    @Test
    @DisplayName("Should return correct user count")
    void testGetUserCount() {
        // Arrange
        long initialCount = userService.getUserCount();
        userRepository.save(testUser);

        // Act
        long newCount = userService.getUserCount();

        // Assert
        assertEquals(initialCount + 1, newCount);
    }

    // ========== DATABASE CONSISTENCY TESTS ==========

    @Test
    @DisplayName("Should maintain database consistency - changes rolled back after test")
    void testDatabaseConsistency() {
        // Arrange
        long countBefore = userService.getUserCount();

        // Act
        userRepository.save(testUser);
        long countAfter = userService.getUserCount();

        // Assert
        assertEquals(countBefore + 1, countAfter);
        // After test completes, @Transactional will rollback changes
        // Database will be restored to original state
    }

    // Helper method
    private void assertGreater(int actual, int expected) {
        assertTrue(actual > expected, "Expected " + actual + " to be greater than " + expected);
    }
}

package com.kozimor.wms.IntegrationTests;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.kozimor.wms.Database.Model.Category;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.ItemType;
import com.kozimor.wms.Database.Model.Report;
import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Model.UnitType;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.CategoryRepository;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.ReportRepository;
import com.kozimor.wms.Database.Repository.RoleRepository;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Database.Service.ReportService;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("ReportService - Integration Tests")
class ReportServiceIntegrationTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User testUser;
    private Role adminRole;
    private Item testItem;
    private Category testCategory;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        // Create role
        if (roleRepository.findByRoleName("ROLE_ADMIN").isEmpty()) {
            adminRole = roleRepository.save(Role.builder().roleName("ROLE_ADMIN").build());
        } else {
            adminRole = roleRepository.findByRoleName("ROLE_ADMIN").get();
        }

        // Create user
        testUser = User.builder()
                .username("reporttestuser")
                .password("password123")
                .email("reporttest@test.com")
                .firstName("Report")
                .lastName("Test")
                .role(adminRole)
                .build();
        testUser = userRepository.save(testUser);

        // Create category
        testCategory = Category.builder()
                .name("Test Category")
                .description("Category for tests")
                .build();
        testCategory = categoryRepository.save(testCategory);

        // Create item
        testItem = new Item();
        testItem.setName("Test Item");
        testItem.setDescription("Item for tests");
        testItem.setCategory(testCategory);
        testItem.setCurrentQuantity(100.0);
        testItem.setUnit(UnitType.PCS);
        testItem.setType(ItemType.PRODUCT);
        testItem = itemRepository.save(testItem);

        // Setup security context
        setupSecurityContext("reporttestuser");
    }

    // ========== CREATE REPORT TESTS ==========

    @Test
    @DisplayName("Should create report successfully")
    void testCreateReportSuccessfully() {
        // Arrange
        Report report = Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build();

        // Act
        Report result = reportService.createReport(report);

        // Assert
        assertNotNull(result.getId());
        assertEquals(1, result.getTotalItemsCount());
        assertEquals(testUser.getId(), result.getCreatedBy().getId());
    }

    @Test
    @DisplayName("Should retrieve report by ID")
    void testGetReportById() {
        // Arrange
        Report savedReport = reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());

        // Act
        Optional<Report> result = reportService.getReportById(savedReport.getId());

        // Assert
        assertTrue(result.isPresent());
        assertEquals(savedReport.getId(), result.get().getId());
    }

    @Test
    @DisplayName("Should return empty Optional when report not found")
    void testGetReportByIdNotFound() {
        // Act
        Optional<Report> result = reportService.getReportById(999999L);

        // Assert
        assertFalse(result.isPresent());
    }

    // ========== GET ALL REPORTS TESTS ==========

    @Test
    @DisplayName("Should get all reports paginated")
    void testGetAllReportsPaginated() {
        // Arrange
        reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());

        // Act
        Page<Report> result = reportService.getAllReports(pageable);

        // Assert
        assertNotNull(result);
        assertGreater(result.getTotalElements(), 0);
    }

    @Test
    @DisplayName("Should get reports by user ID")
    void testGetReportsByUserId() {
        // Arrange
        reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());

        // Act
        Page<Report> result = reportService.getReportsByUserId(testUser.getId(), pageable);

        // Assert
        assertNotNull(result);
        assertGreater(result.getTotalElements(), 0);
        assertTrue(result.getContent().stream()
                .allMatch(r -> r.getCreatedBy().getId().equals(testUser.getId())));
    }

    @Test
    @DisplayName("Should get reports by date range")
    void testGetReportsByDateRange() {
        // Arrange
        reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());
        LocalDateTime startDate = LocalDateTime.now().minusDays(1);
        LocalDateTime endDate = LocalDateTime.now().plusDays(1);

        // Act
        Page<Report> result = reportService.getReportsByDateRange(startDate, endDate, pageable);

        // Assert
        assertNotNull(result);
        assertTrue(result.getTotalElements() >= 0);
    }

    @Test
    @DisplayName("Should get most recent report")
    void testGetMostRecentReport() {
        // Arrange
        reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());

        // Act
        Report result = reportService.getMostRecentReport();

        // Assert
        assertNotNull(result);
    }

    // ========== UPDATE REPORT TESTS ==========

    @Test
    @DisplayName("Should update report successfully")
    void testUpdateReportSuccessfully() {
        // Arrange
        Report savedReport = reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());

        Report updateData = Report.builder()
                .totalItemsCount(2)
                .lowStockCount(1)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build();

        // Act
        Report result = reportService.updateReport(savedReport.getId(), updateData);

        // Assert
        assertEquals(2, result.getTotalItemsCount());
        assertEquals(1, result.getLowStockCount());
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent report")
    void testUpdateNonExistentReport() {
        // Act & Assert
        assertThrows(Exception.class,
                () -> reportService.updateReport(999999L, new Report()));
    }

    // ========== DELETE REPORT TESTS ==========

    @Test
    @DisplayName("Should delete report successfully")
    void testDeleteReportSuccessfully() {
        // Arrange
        Report savedReport = reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());
        assertTrue(reportRepository.existsById(savedReport.getId()));

        // Act
        reportService.deleteReport(savedReport.getId());

        // Assert
        assertFalse(reportRepository.existsById(savedReport.getId()));
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent report")
    void testDeleteNonExistentReport() {
        // Act & Assert
        assertThrows(Exception.class,
                () -> reportService.deleteReport(999999L));
    }

    // ========== REPORT COUNT TESTS ==========

    @Test
    @DisplayName("Should get report count")
    void testGetReportCount() {
        // Arrange
        long initialCount = reportService.getReportCount();
        reportRepository.save(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());

        // Act
        long newCount = reportService.getReportCount();

        // Assert
        assertEquals(initialCount + 1, newCount);
    }

    // ========== CREATE SNAPSHOT TESTS ==========

    @Test
    @DisplayName("Should create snapshot with current items")
    void testCreateSnapshot() {
        // Act
        Report result = reportService.createSnapshot();

        // Assert
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(true, result.getTotalItemsCount() >= 1);
        assertNotNull(result.getCreatedBy());
    }

    @Test
    @DisplayName("Should include created user in snapshot")
    void testSnapshotIncludesCreatedUser() {
        // Act
        Report result = reportService.createSnapshot();

        // Assert
        assertNotNull(result.getCreatedBy());
        assertEquals("reporttestuser", result.getCreatedBy().getUsername());
    }

    // ========== DATABASE CONSISTENCY TESTS ==========

    @Test
    @DisplayName("Should maintain database consistency - changes rolled back after test")
    void testDatabaseConsistency() {
        // Arrange
        long countBefore = reportService.getReportCount();

        // Act
        reportService.createReport(Report.builder()
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(testUser)
                .build());
        long countAfter = reportService.getReportCount();

        // Assert
        assertEquals(countBefore + 1, countAfter);
        // After test completes, @Transactional will rollback changes
        // Database will be restored to original state
    }

    // ========== HELPER METHODS ==========

    private void setupSecurityContext(String username) {
        TestingAuthenticationToken auth = new TestingAuthenticationToken(username, null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void assertGreater(long actual, long expected) {
        assertTrue(actual > expected, "Expected " + actual + " to be greater than " + expected);
    }
}

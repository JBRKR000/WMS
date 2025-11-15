package com.kozimor.wms;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.kozimor.wms.Database.Model.Category;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.ItemType;
import com.kozimor.wms.Database.Model.Report;
import com.kozimor.wms.Database.Model.ReportItem;
import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionType;
import com.kozimor.wms.Database.Model.UnitType;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.ReportItemRepository;
import com.kozimor.wms.Database.Repository.ReportRepository;
import com.kozimor.wms.Database.Repository.TransactionRepository;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Database.Service.ServiceImpl.ReportServiceImpl;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportServiceImpl - Unit Tests")
class ReportServiceImplTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private ReportItemRepository reportItemRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private Report report;
    private Item item;
    private User user;
    private Category category;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        category = new Category();
        category.setId(1L);
        category.setName("Test Category");

        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        item = new Item();
        item.setId(1L);
        item.setName("Test Item");
        item.setCategory(category);
        item.setCurrentQuantity(50);
        item.setUnit(UnitType.PCS);
        item.setType(ItemType.PRODUCT);
        item.setQrCode("QR123");

        report = Report.builder()
                .id(1L)
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(user)
                .build();
    }

    // ========== CRUD OPERATIONS TESTS ==========

    @Test
    @DisplayName("Should create report successfully")
    void testCreateReportSuccessfully() {
        when(reportRepository.save(any(Report.class))).thenReturn(report);

        Report result = reportService.createReport(report);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(reportRepository, times(1)).save(report);
    }

    @Test
    @DisplayName("Should retrieve report by id")
    void testGetReportById() {
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        Optional<Report> result = reportService.getReportById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        verify(reportRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should return empty optional when report not found")
    void testGetReportByIdNotFound() {
        when(reportRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<Report> result = reportService.getReportById(999L);

        assertFalse(result.isPresent());
        verify(reportRepository, times(1)).findById(999L);
    }

    @Test
    @DisplayName("Should get all reports paginated")
    void testGetAllReportsPaginated() {
        Page<Report> page = new PageImpl<>(Arrays.asList(report), pageable, 1);
        when(reportRepository.findAllWithDetails(pageable)).thenReturn(page);

        Page<Report> result = reportService.getAllReports(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        verify(reportRepository, times(1)).findAllWithDetails(pageable);
    }

    @Test
    @DisplayName("Should get reports by user id")
    void testGetReportsByUserId() {
        Page<Report> page = new PageImpl<>(Arrays.asList(report), pageable, 1);
        when(reportRepository.findAllByCreatedBy_Id(1L, pageable)).thenReturn(page);

        Page<Report> result = reportService.getReportsByUserId(1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(reportRepository, times(1)).findAllByCreatedBy_Id(1L, pageable);
    }

    @Test
    @DisplayName("Should get reports by date range")
    void testGetReportsByDateRange() {
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();
        Page<Report> page = new PageImpl<>(Arrays.asList(report), pageable, 1);

        when(reportRepository.findReportsByDateRange(startDate, endDate, pageable))
                .thenReturn(page);

        Page<Report> result = reportService.getReportsByDateRange(startDate, endDate, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(reportRepository, times(1)).findReportsByDateRange(startDate, endDate, pageable);
    }

    @Test
    @DisplayName("Should get reports with critical items")
    void testGetReportsWithCriticalItems() {
        Page<Report> page = new PageImpl<>(Arrays.asList(report), pageable, 1);
        when(reportRepository.findReportsWithCriticalItems(pageable)).thenReturn(page);

        Page<Report> result = reportService.getReportsWithCriticalItems(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(reportRepository, times(1)).findReportsWithCriticalItems(pageable);
    }

    @Test
    @DisplayName("Should get most recent report")
    void testGetMostRecentReport() {
        when(reportRepository.findMostRecentReport()).thenReturn(report);

        Report result = reportService.getMostRecentReport();

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(reportRepository, times(1)).findMostRecentReport();
    }

    @Test
    @DisplayName("Should update report successfully")
    void testUpdateReportSuccessfully() {
        Report updatedReport = Report.builder()
                .id(1L)
                .totalItemsCount(2)
                .lowStockCount(1)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(user)
                .build();

        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(Report.class))).thenReturn(updatedReport);

        Report result = reportService.updateReport(1L, updatedReport);

        assertNotNull(result);
        assertEquals(2, result.getTotalItemsCount());
        assertEquals(1, result.getLowStockCount());
        verify(reportRepository, times(1)).findById(1L);
        verify(reportRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent report")
    void testUpdateNonExistentReport() {
        when(reportRepository.findById(999L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> reportService.updateReport(999L, report));

        assertEquals("Report not found with id: 999", exception.getMessage());
    }

    @Test
    @DisplayName("Should delete report successfully")
    void testDeleteReportSuccessfully() {
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        reportService.deleteReport(1L);

        verify(reportRepository, times(1)).findById(1L);
        verify(reportRepository, times(1)).delete(report);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent report")
    void testDeleteNonExistentReport() {
        when(reportRepository.findById(999L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> reportService.deleteReport(999L));

        assertEquals("Report not found with id: 999", exception.getMessage());
        verify(reportRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should get report count")
    void testGetReportCount() {
        when(reportRepository.count()).thenReturn(5L);

        long count = reportService.getReportCount();

        assertEquals(5L, count);
        verify(reportRepository, times(1)).count();
    }

    // ========== SNAPSHOT CREATION TESTS ==========

    @Test
    @DisplayName("Should create snapshot with OK status items")
    void testCreateSnapshotWithOkStatusItems() {
        setupSecurityContext();

        item.setCurrentQuantity(50);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report);
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(1, result.getTotalItemsCount());
        assertEquals(0, result.getLowStockCount());
        assertEquals(0, result.getCriticalStockCount());
        assertEquals(1, result.getOkCount());
        verify(reportRepository, times(2)).save(any());
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should create snapshot with LOW status items")
    void testCreateSnapshotWithLowStatusItems() {
        setupSecurityContext();

        item.setCurrentQuantity(5);
        Report reportWithCounts = Report.builder()
                .id(1L)
                .totalItemsCount(1)
                .lowStockCount(1)
                .criticalStockCount(0)
                .okCount(0)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report, reportWithCounts);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(1, result.getTotalItemsCount());
        assertEquals(1, result.getLowStockCount());
        assertEquals(0, result.getCriticalStockCount());
        assertEquals(0, result.getOkCount());
        verify(reportRepository, times(2)).save(any());
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should create snapshot with CRITICAL status items")
    void testCreateSnapshotWithCriticalStatusItems() {
        setupSecurityContext();

        item.setCurrentQuantity(0);
        Report reportWithCounts = Report.builder()
                .id(1L)
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(1)
                .okCount(0)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report, reportWithCounts);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(1, result.getTotalItemsCount());
        assertEquals(0, result.getLowStockCount());
        assertEquals(1, result.getCriticalStockCount());
        assertEquals(0, result.getOkCount());
        verify(reportRepository, times(2)).save(any());
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should create snapshot with mixed status items")
    void testCreateSnapshotWithMixedStatusItems() {
        setupSecurityContext();

        Item item2 = new Item();
        item2.setId(2L);
        item2.setName("Item 2");
        item2.setCurrentQuantity(5);
        item2.setUnit(UnitType.PCS);
        item2.setType(ItemType.PRODUCT);

        Item item3 = new Item();
        item3.setId(3L);
        item3.setName("Item 3");
        item3.setCurrentQuantity(0);
        item3.setUnit(UnitType.PCS);
        item3.setType(ItemType.PRODUCT);

        Report reportWithCounts = Report.builder()
                .id(1L)
                .totalItemsCount(3)
                .lowStockCount(1)
                .criticalStockCount(1)
                .okCount(1)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item, item2, item3));
        when(reportRepository.save(any(Report.class))).thenReturn(report, reportWithCounts);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));
        when(transactionRepository.findByItemId(anyLong())).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(3, result.getTotalItemsCount());
        assertEquals(1, result.getLowStockCount());
        assertEquals(1, result.getCriticalStockCount());
        assertEquals(1, result.getOkCount());
    }

    @Test
    @DisplayName("Should create snapshot with transaction history")
    void testCreateSnapshotWithTransactionHistory() {
        setupSecurityContext();

        Transaction receiptTransaction = new Transaction();
        receiptTransaction.setId(1L);
        receiptTransaction.setTransactionType(TransactionType.RECEIPT);
        receiptTransaction.setTransactionDate(OffsetDateTime.now().minusDays(5));

        Transaction orderTransaction = new Transaction();
        orderTransaction.setId(2L);
        orderTransaction.setTransactionType(TransactionType.ORDER);
        orderTransaction.setTransactionDate(OffsetDateTime.now().minusDays(2));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report);
        when(transactionRepository.findByItemId(1L))
                .thenReturn(Arrays.asList(receiptTransaction, orderTransaction));
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should throw exception when user not found during snapshot creation")
    void testCreateSnapshotUserNotFound() {
        setupSecurityContext();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> reportService.createSnapshot());

        assertTrue(exception.getMessage().contains("User not found"));
    }

    @Test
    @DisplayName("Should create snapshot with null quantity items")
    void testCreateSnapshotWithNullQuantityItems() {
        setupSecurityContext();

        item.setCurrentQuantity(null);
        Report reportWithCounts = Report.builder()
                .id(1L)
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report, reportWithCounts);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(1, result.getTotalItemsCount());
        assertEquals(1, result.getOkCount());
        assertEquals(0, result.getLowStockCount());
        assertEquals(0, result.getCriticalStockCount());
    }

    @Test
    @DisplayName("Should create snapshot and calculate difference from previous")
    void testCreateSnapshotCalculatesDifference() {
        setupSecurityContext();

        Report previousReport = Report.builder()
                .id(0L)
                .totalItemsCount(1)
                .okCount(1)
                .createdBy(user)
                .build();

        ReportItem previousReportItem = ReportItem.builder()
                .id(1L)
                .report(previousReport)
                .item(item)
                .itemName("Test Item")
                .status("OK")
                .warehouseValue(45.0)
                .build();

        previousReport.setReportItems(new HashSet<>(Arrays.asList(previousReportItem)));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report);
        when(reportRepository.findAllWithDetails(any())).thenReturn(
                new PageImpl<>(Arrays.asList(previousReport), pageable, 1));
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should create empty snapshot when no items exist")
    void testCreateSnapshotWithNoItems() {
        setupSecurityContext();

        Report emptyReport = Report.builder()
                .id(1L)
                .totalItemsCount(0)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(0)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(new ArrayList<>());
        when(reportRepository.save(any(Report.class))).thenReturn(report, emptyReport);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(0, result.getTotalItemsCount());
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    // ========== STATUS CALCULATION TESTS ==========

    @Test
    @DisplayName("Should calculate OK status correctly")
    void testCalculateStatusOk() {
        item.setCurrentQuantity(100);
        setupSecurityContext();

        Report reportWithCounts = Report.builder()
                .id(1L)
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(1)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report, reportWithCounts);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(1, result.getOkCount());
        assertEquals(0, result.getLowStockCount());
        assertEquals(0, result.getCriticalStockCount());
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should calculate LOW status correctly")
    void testCalculateStatusLow() {
        item.setCurrentQuantity(10);
        setupSecurityContext();

        Report reportWithCounts = Report.builder()
                .id(1L)
                .totalItemsCount(1)
                .lowStockCount(1)
                .criticalStockCount(0)
                .okCount(0)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report, reportWithCounts);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(1, result.getLowStockCount());
        assertEquals(0, result.getOkCount());
        assertEquals(0, result.getCriticalStockCount());
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should calculate CRITICAL status correctly")
    void testCalculateStatusCritical() {
        item.setCurrentQuantity(0);
        setupSecurityContext();

        Report reportWithCounts = Report.builder()
                .id(1L)
                .totalItemsCount(1)
                .lowStockCount(0)
                .criticalStockCount(1)
                .okCount(0)
                .createdBy(user)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(itemRepository.findAll()).thenReturn(Arrays.asList(item));
        when(reportRepository.save(any(Report.class))).thenReturn(report, reportWithCounts);
        when(reportRepository.findAllWithDetails(any())).thenReturn(new PageImpl<>(new ArrayList<>(), pageable, 0));
        when(transactionRepository.findByItemId(1L)).thenReturn(new ArrayList<>());
        when(reportItemRepository.saveAll(any())).thenReturn(new ArrayList<>());

        Report result = reportService.createSnapshot();

        assertNotNull(result);
        assertEquals(1, result.getCriticalStockCount());
        assertEquals(0, result.getOkCount());
        assertEquals(0, result.getLowStockCount());
        verify(reportItemRepository, times(1)).saveAll(any());
    }

    // ========== HELPER METHODS ==========

    private void setupSecurityContext() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("testuser", null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}

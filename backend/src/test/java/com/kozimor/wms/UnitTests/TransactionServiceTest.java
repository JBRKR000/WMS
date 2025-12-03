package com.kozimor.wms.UnitTests;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kozimor.wms.Database.Model.Category;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.Location;
import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionStatus;
import com.kozimor.wms.Database.Model.TransactionType;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.TransactionRepository;
import com.kozimor.wms.Database.Service.ServiceImpl.TransactionServiceImpl;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionServiceImpl - Critical Tests")
class TransactionServiceImplTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    private Transaction transaction;
    private Item item;
    private User user;
    private Location location;
    private Category category;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(1L);
        category.setName("Test Category");

        item = new Item();
        item.setId(1L);
        item.setName("Test Item");
        item.setCategory(category);
        item.setCurrentQuantity(100);

        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        location = new Location();
        location.setId(1L);
        location.setCode("LOC-001");
        location.setName("Warehouse A");

        transaction = new Transaction();
        transaction.setId(1L);
        transaction.setItem(item);
        transaction.setUser(user);
        transaction.setLocation(location);
        transaction.setQuantity(10);
        transaction.setTransactionType(TransactionType.RECEIPT);
        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setDescription("Test transaction");
        transaction.setTransactionDate(OffsetDateTime.now());
    }

    // ========== TRANSACTION TYPE TESTS - CRITICAL ==========

    @Test
    @DisplayName("Should create RECEIPT transaction and increase quantity")
    void testCreateReceiptTransaction() {
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(110, item.getCurrentQuantity());
        verify(itemRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("Should create ORDER transaction and decrease quantity")
    void testCreateOrderTransaction() {
        transaction.setTransactionType(TransactionType.ORDER);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(90, item.getCurrentQuantity());
        verify(itemRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("Should create ISSUE_TO_PRODUCTION transaction and decrease quantity")
    void testCreateIssueToProductionTransaction() {
        transaction.setTransactionType(TransactionType.ISSUE_TO_PRODUCTION);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(90, item.getCurrentQuantity());
    }

    @Test
    @DisplayName("Should create ISSUE_TO_SALES transaction and decrease quantity")
    void testCreateIssueToSalesTransaction() {
        transaction.setTransactionType(TransactionType.ISSUE_TO_SALES);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(90, item.getCurrentQuantity());
    }

    @Test
    @DisplayName("Should create RETURN transaction and increase quantity")
    void testCreateReturnTransaction() {
        transaction.setTransactionType(TransactionType.RETURN);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(110, item.getCurrentQuantity());
    }

    // ========== VALIDATION TESTS - CRITICAL ==========

    @Test
    @DisplayName("Should throw exception when quantity is null")
    void testCreateTransactionWithNullQuantity() {
        transaction.setQuantity(null);

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should throw exception when quantity is zero")
    void testCreateTransactionWithZeroQuantity() {
        transaction.setQuantity(0);

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should throw exception when quantity is negative")
    void testCreateTransactionWithNegativeQuantity() {
        transaction.setQuantity(-5);

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should throw exception when item is null")
    void testCreateTransactionWithNullItem() {
        transaction.setItem(null);

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should throw exception when user is null")
    void testCreateTransactionWithNullUser() {
        transaction.setUser(null);

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should throw exception when location is null")
    void testCreateTransactionWithNullLocation() {
        transaction.setLocation(null);

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    // ========== BUSINESS LOGIC TESTS ==========

    @Test
    @DisplayName("Should throw exception when item not found in database")
    void testCreateTransactionWithNonExistentItem() {
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should throw exception when insufficient quantity for ORDER")
    void testCreateOrderTransactionWithInsufficientQuantity() {
        transaction.setTransactionType(TransactionType.ORDER);
        transaction.setQuantity(150);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should throw exception when insufficient quantity for ISSUE_TO_PRODUCTION")
    void testCreateIssueToProductionWithInsufficientQuantity() {
        transaction.setTransactionType(TransactionType.ISSUE_TO_PRODUCTION);
        transaction.setQuantity(150);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));
    }

    @Test
    @DisplayName("Should successfully create transaction with exact quantity match")
    void testCreateTransactionWithExactQuantityMatch() {
        transaction.setTransactionType(TransactionType.ORDER);
        transaction.setQuantity(100);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(0, item.getCurrentQuantity());
    }

    @Test
    @DisplayName("Should successfully create transaction with large quantity")
    void testCreateTransactionWithLargeQuantity() {
        transaction.setQuantity(1000);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(1100, item.getCurrentQuantity());
    }

    // ========== CRUD OPERATIONS ==========

    @Test
    @DisplayName("Should retrieve transaction by ID")
    void testGetTransactionById() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(transaction));

        Optional<Transaction> result = transactionService.getTransactionById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    @DisplayName("Should return empty when transaction not found")
    void testGetTransactionByIdNotFound() {
        when(transactionRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<Transaction> result = transactionService.getTransactionById(999L);

        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should delete transaction successfully")
    void testDeleteTransactionSuccessfully() {
        when(transactionRepository.existsById(1L)).thenReturn(true);

        transactionService.deleteTransaction(1L);

        verify(transactionRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent transaction")
    void testDeleteNonExistentTransaction() {
        when(transactionRepository.existsById(999L)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, 
            () -> transactionService.deleteTransaction(999L));
    }

    @Test
    @DisplayName("Should get transaction count")
    void testGetTransactionCount() {
        when(transactionRepository.count()).thenReturn(5L);

        long count = transactionService.getTransactionCount();

        assertEquals(5L, count);
    }
}

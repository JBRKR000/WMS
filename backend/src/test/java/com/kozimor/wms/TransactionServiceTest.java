package com.kozimor.wms;

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
@DisplayName("TransactionServiceImpl - Unit Tests")
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

    // ========== VALIDATION TESTS ==========

    @Test
    @DisplayName("Should create RECEIPT transaction and increase quantity")
    void testCreateReceiptTransaction() {
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(110, item.getCurrentQuantity());
        verify(transactionRepository, times(1)).save(transaction);
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
        verify(transactionRepository, times(1)).save(transaction);
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
        verify(transactionRepository, times(1)).save(transaction);
        verify(itemRepository, times(1)).save(item);
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
        verify(transactionRepository, times(1)).save(transaction);
        verify(itemRepository, times(1)).save(item);
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
        verify(transactionRepository, times(1)).save(transaction);
        verify(itemRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("Should throw exception when quantity is null")
    void testCreateTransactionWithNullQuantity() {
        transaction.setQuantity(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Quantity must be greater than 0", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when quantity is zero")
    void testCreateTransactionWithZeroQuantity() {
        transaction.setQuantity(0);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Quantity must be greater than 0", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when quantity is negative")
    void testCreateTransactionWithNegativeQuantity() {
        transaction.setQuantity(-5);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Quantity must be greater than 0", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when item is null")
    void testCreateTransactionWithNullItem() {
        transaction.setItem(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Item is required", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when item id is null")
    void testCreateTransactionWithNullItemId() {
        item.setId(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Item is required", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when user is null")
    void testCreateTransactionWithNullUser() {
        transaction.setUser(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("User is required", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when user id is null")
    void testCreateTransactionWithNullUserId() {
        user.setId(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("User is required", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when location is null")
    void testCreateTransactionWithNullLocation() {
        transaction.setLocation(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Location is required", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when location id is null")
    void testCreateTransactionWithNullLocationId() {
        location.setId(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Location is required", exception.getMessage());
        verify(transactionRepository, never()).save(any());
        verify(itemRepository, never()).save(any());
    }

    // ========== TRANSACTION TYPE TESTS ==========

    @Test
    @DisplayName("Should throw exception when item not found in database")
    void testCreateTransactionWithNonExistentItem() {
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, 
            () -> transactionService.createTransaction(transaction));

        assertEquals("Item not found with id: 1", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when insufficient quantity for ORDER")
    void testCreateOrderTransactionWithInsufficientQuantity() {
        transaction.setTransactionType(TransactionType.ORDER);
        transaction.setQuantity(150);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertTrue(exception.getMessage().contains("Insufficient quantity"));
        verify(itemRepository, never()).save(item);
    }

    @Test
    @DisplayName("Should throw exception when insufficient quantity for ISSUE_TO_PRODUCTION")
    void testCreateIssueToProductionWithInsufficientQuantity() {
        transaction.setTransactionType(TransactionType.ISSUE_TO_PRODUCTION);
        transaction.setQuantity(150);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertTrue(exception.getMessage().contains("Insufficient quantity"));
        verify(itemRepository, never()).save(item);
    }

    @Test
    @DisplayName("Should throw exception when insufficient quantity for ISSUE_TO_SALES")
    void testCreateIssueToSalesWithInsufficientQuantity() {
        transaction.setTransactionType(TransactionType.ISSUE_TO_SALES);
        transaction.setQuantity(200);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertTrue(exception.getMessage().contains("Insufficient quantity"));
        verify(itemRepository, never()).save(item);
    }

    // ========== EDGE CASES TESTS ==========

    @Test
    @DisplayName("Should handle transaction when current quantity is null")
    void testCreateTransactionWithNullCurrentQuantity() {
        item.setCurrentQuantity(null);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(10, item.getCurrentQuantity());
    }

    @Test
    @DisplayName("Should set quantity to 0 when result would be negative")
    void testCreateTransactionPreventNegativeQuantity() {
        transaction.setTransactionType(TransactionType.ORDER);
        transaction.setQuantity(50);
        item.setCurrentQuantity(30);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> transactionService.createTransaction(transaction));

        assertTrue(exception.getMessage().contains("Insufficient quantity"));
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
        verify(itemRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("Should successfully create transaction with quantity of 1")
    void testCreateTransactionWithMinimalQuantity() {
        transaction.setQuantity(1);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        Transaction result = transactionService.createTransaction(transaction);

        assertNotNull(result);
        assertEquals(101, item.getCurrentQuantity());
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
        verify(itemRepository, times(1)).save(item);
    }

    // ========== CRUD OPERATIONS TESTS ==========

    @Test
    @DisplayName("Should retrieve transaction by id")
    void testGetTransactionById() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(transaction));

        Optional<Transaction> result = transactionService.getTransactionById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        verify(transactionRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should return empty optional when transaction not found")
    void testGetTransactionByIdNotFound() {
        when(transactionRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<Transaction> result = transactionService.getTransactionById(999L);

        assertFalse(result.isPresent());
        verify(transactionRepository, times(1)).findById(999L);
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

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, 
            () -> transactionService.deleteTransaction(999L));

        assertEquals("Transaction not found with id: 999", exception.getMessage());
        verify(transactionRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Should get transaction count")
    void testGetTransactionCount() {
        when(transactionRepository.count()).thenReturn(5L);

        long count = transactionService.getTransactionCount();

        assertEquals(5L, count);
        verify(transactionRepository, times(1)).count();
    }

    // ========== UPDATE TESTS ==========

    @Test
    @DisplayName("Should update transaction successfully")
    void testUpdateTransactionSuccessfully() {
        Transaction updatedTransaction = new Transaction();
        updatedTransaction.setId(1L);
        updatedTransaction.setItem(item);
        updatedTransaction.setUser(user);
        updatedTransaction.setLocation(location);
        updatedTransaction.setQuantity(20);
        updatedTransaction.setTransactionType(TransactionType.RECEIPT);
        updatedTransaction.setTransactionStatus(TransactionStatus.PENDING);
        updatedTransaction.setDescription("Updated description");

        when(transactionRepository.findById(1L)).thenReturn(Optional.of(transaction));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(updatedTransaction);

        Transaction result = transactionService.updateTransaction(1L, updatedTransaction);

        assertNotNull(result);
        assertEquals("Updated description", result.getDescription());
        verify(transactionRepository, times(1)).findById(1L);
        verify(transactionRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent transaction")
    void testUpdateNonExistentTransaction() {
        when(transactionRepository.findById(999L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, 
            () -> transactionService.updateTransaction(999L, transaction));

        assertEquals("Transaction not found with id: 999", exception.getMessage());
    }
}

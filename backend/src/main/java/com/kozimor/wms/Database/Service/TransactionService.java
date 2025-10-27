package com.kozimor.wms.Database.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionType;
import com.kozimor.wms.Database.Model.DTO.TransactionDTO;
import com.kozimor.wms.Database.Model.DTO.TransactionForOrderDTO;

@Service
public interface TransactionService {
    
    /**
     * Create a new transaction
     * @param transaction The transaction to create
     * @return The created transaction
     */
    Transaction createTransaction(Transaction transaction);

    /**
     * Get all transactions
     * @return List of all transactions
     */
    List<Transaction> getAllTransactions();

    /**
     * Get a transaction by its ID
     * @param id The ID of the transaction to find
     * @return The transaction if found, otherwise empty Optional
     */
    Optional<Transaction> getTransactionById(Long id);

    /**
     * Get transactions by item ID
     * @param itemId The ID of the item
     * @return List of transactions for the specified item
     */
    List<Transaction> getTransactionsByItemId(Long itemId);

    /**
     * Get transactions by user ID
     * @param userId The ID of the user
     * @return List of transactions for the specified user
     */
    List<Transaction> getTransactionsByUserId(Long userId);

    /**
     * Get transactions by type
     * @param type The type of transactions to find
     * @return List of transactions of the specified type
     */
    List<Transaction> getTransactionsByType(TransactionType type);

    /**
     * Get transactions within a date range
     * @param startDate Start of the date range
     * @param endDate End of the date range
     * @return List of transactions within the specified date range
     */
    List<Transaction> getTransactionsByDateRange(OffsetDateTime startDate, OffsetDateTime endDate);

    /**
     * Update an existing transaction
     * @param id The ID of the transaction to update
     * @param transaction The updated transaction data
     * @return The updated transaction
     */
    Transaction updateTransaction(Long id, Transaction transaction);

    /**
     * Delete a transaction by its ID
     * @param id The ID of the transaction to delete
     */
    void deleteTransaction(Long id);

    long getTransactionCount();
    Page<TransactionDTO> getTransactionsPaginated(int page, int size);

    /**
     * Get all transactions with ORDER type
     * @return List of ORDER transactions as TransactionForOrderDTO
     */
    List<TransactionForOrderDTO> getOrderTransactions();

    /**
     * Update transaction status
     * @param id The ID of the transaction to update
     * @param status The new status value
     * @return The updated transaction as TransactionForOrderDTO
     */
    TransactionForOrderDTO updateTransactionStatus(Long id, String status);

    /**
     * Get receipt transactions paginated
     * @param page The page number
     * @param size The page size
     * @return Page of RECEIPT transactions as TransactionDTO
     */
    Page<TransactionDTO> getReceiptTransactionsPaginated(int page, int size);

    /**
     * Get all transactions with ISSUE types (ISSUE_TO_PRODUCTION, ISSUE_TO_SALES, ORDER)
     * @return List of ISSUE transactions
     */
    List<Transaction> getIssueTransactions();

    /**
     * Get issue transactions paginated (ISSUE_TO_PRODUCTION, ISSUE_TO_SALES, ORDER)
     * @param page The page number
     * @param size The page size
     * @return Page of ISSUE transactions as TransactionDTO
     */
    Page<TransactionDTO> getIssueTransactionsPaginated(int page, int size);
}

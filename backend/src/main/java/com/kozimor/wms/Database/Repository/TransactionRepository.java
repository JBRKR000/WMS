package com.kozimor.wms.Database.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;

import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionType;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByItemId(Long itemId);
    
    List<Transaction> findByUserId(Long userId);
    
    List<Transaction> findByTransactionType(TransactionType type);
    
    Page<Transaction> findByTransactionType(TransactionType type, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t WHERE t.transactionDate BETWEEN :startDate AND :endDate")
    List<Transaction> findByDateRange(@Param("startDate") OffsetDateTime startDate, 
                                    @Param("endDate") OffsetDateTime endDate);
    
    List<Transaction> findByTransactionTypeOrderByTransactionDateDesc(TransactionType type);
    
    @Query("SELECT t FROM Transaction t WHERE t.transactionType IN ('ISSUE_TO_PRODUCTION', 'ISSUE_TO_SALES', 'ORDER') ORDER BY t.transactionDate DESC")
    List<Transaction> findIssueTransactions();
    
    @Query("SELECT t FROM Transaction t WHERE t.transactionType IN ('ISSUE_TO_PRODUCTION', 'ISSUE_TO_SALES', 'ORDER') ORDER BY t.transactionDate DESC")
    Page<Transaction> findIssueTransactions(Pageable pageable);
}

package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionType;
import com.kozimor.wms.Database.Repository.TransactionRepository;
import com.kozimor.wms.Database.Service.TransactionService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;

    @Autowired
    public TransactionServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Override
    public Transaction createTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Transaction> getTransactionById(Long id) {
        return transactionRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByItemId(Long itemId) {
        return transactionRepository.findByItemId(itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByType(TransactionType type) {
        return transactionRepository.findByTransactionType(type);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return transactionRepository.findByDateRange(startDate, endDate);
    }

    @Override
    public Transaction updateTransaction(Long id, Transaction transactionDetails) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + id));

        transaction.setTransactionType(transactionDetails.getTransactionType());
        transaction.setItem(transactionDetails.getItem());
        transaction.setQuantity(transactionDetails.getQuantity());
        transaction.setUser(transactionDetails.getUser());
        transaction.setDescription(transactionDetails.getDescription());

        return transactionRepository.save(transaction);
    }

    @Override
    public void deleteTransaction(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new EntityNotFoundException("Transaction not found with id: " + id);
        }
        transactionRepository.deleteById(id);
    }
}
package com.kozimor.wms.Database.Service.ServiceImpl;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionType;
import com.kozimor.wms.Database.Model.DTO.TransactionDTO;
import com.kozimor.wms.Database.Repository.TransactionRepository;
import com.kozimor.wms.Database.Service.TransactionService;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;

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

    @Override
    public long getTransactionCount() {
        return transactionRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionDTO> getTransactionsPaginated(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return transactionRepository.findAll(pageable).map(transaction -> {
            TransactionDTO dto = new TransactionDTO();
            dto.setId(transaction.getId());
            dto.setTransactionDate(transaction.getTransactionDate() != null 
                ? transaction.getTransactionDate().format(formatter) 
                : null);
            dto.setTransactionType(transaction.getTransactionType().name());
            dto.setItemName(transaction.getItem() != null ? transaction.getItem().getName() : null);
            dto.setCategoryName(transaction.getItem() != null && transaction.getItem().getCategory() != null
                ? transaction.getItem().getCategory().getName()
                : null);
            dto.setQuantity(transaction.getQuantity());
            dto.setUserName(transaction.getUser() != null ? transaction.getUser().getUsername() : null);
            dto.setDescription(transaction.getDescription());
            return dto;
        });
        
    }
}
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
import com.kozimor.wms.Database.Model.TransactionStatus;
import com.kozimor.wms.Database.Model.DTO.TransactionDTO;
import com.kozimor.wms.Database.Model.DTO.TransactionForOrderDTO;
import com.kozimor.wms.Database.Repository.TransactionRepository;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Service.TransactionService;
import com.kozimor.wms.Database.Model.Item;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final ItemRepository itemRepository;

    public TransactionServiceImpl(TransactionRepository transactionRepository, ItemRepository itemRepository) {
        this.transactionRepository = transactionRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public Transaction createTransaction(Transaction transaction) {
        if (transaction.getQuantity() == null || transaction.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        if (transaction.getItem() == null || transaction.getItem().getId() == null) {
            throw new IllegalArgumentException("Item is required");
        }
        if (transaction.getUser() == null || transaction.getUser().getId() == null) {
            throw new IllegalArgumentException("User is required");
        }
        // WAŻNE: Location jest teraz wymagana dla poprawnego obliczania obłożenia lokacji
        if (transaction.getLocation() == null || transaction.getLocation().getId() == null) {
            throw new IllegalArgumentException("Location is required");
        }
        
        Transaction saved = transactionRepository.save(transaction);
        Item item = itemRepository.findById(transaction.getItem().getId())
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + transaction.getItem().getId()));
        
        Integer currentQuantity = item.getCurrentQuantity() != null ? item.getCurrentQuantity() : 0;
        Integer newQuantity = currentQuantity;
        
        switch (transaction.getTransactionType()) {
            case RECEIPT:
                newQuantity = currentQuantity + transaction.getQuantity();
                break;
            case ORDER:
            case ISSUE_TO_PRODUCTION:
            case ISSUE_TO_SALES:
                if (currentQuantity < transaction.getQuantity()) {
                    throw new IllegalArgumentException("Insufficient quantity. Available: " + currentQuantity + ", Requested: " + transaction.getQuantity());
                }
                newQuantity = currentQuantity - transaction.getQuantity();
                break;
            case RETURN:
                newQuantity = currentQuantity + transaction.getQuantity();
                break;
            default:
                break;
        }
        if (newQuantity < 0) {
            newQuantity = 0;
        }
        
        item.setCurrentQuantity(newQuantity);
        itemRepository.save(item);
        
        return saved;
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
        transaction.setLocation(transactionDetails.getLocation());
        transaction.setDescription(transactionDetails.getDescription());
        transaction.setTransactionStatus(transactionDetails.getTransactionStatus());

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
            dto.setTransactionStatus(transaction.getTransactionStatus() != null 
                ? transaction.getTransactionStatus().name() 
                : null);
            dto.setLocationCode(transaction.getLocation() != null ? transaction.getLocation().getCode() : null);
            dto.setLocationName(transaction.getLocation() != null ? transaction.getLocation().getName() : null);
            return dto;
        });
        
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionForOrderDTO> getOrderTransactions() {
        List<Transaction> transactions = transactionRepository.findByTransactionTypeOrderByTransactionDateDesc(TransactionType.ORDER);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return transactions.stream().map(transaction -> {
            TransactionForOrderDTO dto = new TransactionForOrderDTO();
            dto.setId(transaction.getId());
            dto.setTransactionDate(transaction.getTransactionDate() != null 
                ? transaction.getTransactionDate().format(formatter) 
                : null);
            dto.setTransactionType(transaction.getTransactionType().name());
            dto.setItemId(transaction.getItem() != null ? transaction.getItem().getId() : null);
            dto.setItemName(transaction.getItem() != null ? transaction.getItem().getName() : null);
            dto.setCategoryName(transaction.getItem() != null && transaction.getItem().getCategory() != null
                ? transaction.getItem().getCategory().getName()
                : null);
            dto.setQuantity(transaction.getQuantity());
            dto.setUserId(transaction.getUser() != null ? transaction.getUser().getId() : null);
            dto.setUserName(transaction.getUser() != null ? transaction.getUser().getUsername() : null);
            dto.setDescription(transaction.getDescription());
            dto.setTransactionStatus(transaction.getTransactionStatus() != null 
                ? transaction.getTransactionStatus().name() 
                : null);
            return dto;
        }).toList();
    }

    @Override
    public TransactionForOrderDTO updateTransactionStatus(Long id, String status) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + id));
        
        try {
            TransactionStatus transactionStatus = TransactionStatus.valueOf(status.toUpperCase());
            transaction.setTransactionStatus(transactionStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid transaction status: " + status);
        }
        
        Transaction saved = transactionRepository.save(transaction);
        
        // Convert to DTO
        TransactionForOrderDTO dto = new TransactionForOrderDTO();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        dto.setId(saved.getId());
        dto.setTransactionDate(saved.getTransactionDate() != null 
            ? saved.getTransactionDate().format(formatter) 
            : null);
        dto.setTransactionType(saved.getTransactionType().name());
        dto.setItemId(saved.getItem() != null ? saved.getItem().getId() : null);
        dto.setItemName(saved.getItem() != null ? saved.getItem().getName() : null);
        dto.setCategoryName(saved.getItem() != null && saved.getItem().getCategory() != null
            ? saved.getItem().getCategory().getName()
            : null);
        dto.setQuantity(saved.getQuantity());
        dto.setUserId(saved.getUser() != null ? saved.getUser().getId() : null);
        dto.setUserName(saved.getUser() != null ? saved.getUser().getUsername() : null);
        dto.setDescription(saved.getDescription());
        dto.setTransactionStatus(saved.getTransactionStatus() != null 
            ? saved.getTransactionStatus().name() 
            : null);
        
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionDTO> getReceiptTransactionsPaginated(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return transactionRepository.findByTransactionType(TransactionType.RECEIPT, pageable).map(transaction -> {
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
            dto.setTransactionStatus(transaction.getTransactionStatus() != null 
                ? transaction.getTransactionStatus().name() 
                : null);
            dto.setLocationCode(transaction.getLocation() != null ? transaction.getLocation().getCode() : null);
            dto.setLocationName(transaction.getLocation() != null ? transaction.getLocation().getName() : null);
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getIssueTransactions() {
        return transactionRepository.findIssueTransactions();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionDTO> getIssueTransactionsPaginated(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return transactionRepository.findIssueTransactions(pageable).map(transaction -> {
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
            dto.setTransactionStatus(transaction.getTransactionStatus() != null 
                ? transaction.getTransactionStatus().name() 
                : null);
            dto.setLocationCode(transaction.getLocation() != null ? transaction.getLocation().getCode() : null);
            dto.setLocationName(transaction.getLocation() != null ? transaction.getLocation().getName() : null);
            return dto;
        });
    }
}
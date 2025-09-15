package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kozimor.wms.Database.Model.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}

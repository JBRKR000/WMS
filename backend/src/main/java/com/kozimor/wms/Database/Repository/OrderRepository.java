package com.kozimor.wms.Database.Repository;

import com.kozimor.wms.Database.Model.Order;
import com.kozimor.wms.Database.Model.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    
    Page<Order> findByOrderStatus(TransactionStatus status, Pageable pageable);
    
    Page<Order> findByCreatedById(Long userId, Pageable pageable);
}

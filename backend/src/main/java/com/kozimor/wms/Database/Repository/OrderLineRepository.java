package com.kozimor.wms.Database.Repository;

import com.kozimor.wms.Database.Model.OrderLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderLineRepository extends JpaRepository<OrderLine, Long> {
    List<OrderLine> findByOrderId(Long orderId);
    
    List<OrderLine> findByItemId(Long itemId);
}

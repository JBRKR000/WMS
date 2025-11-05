package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.DTO.OrderDTO;
import com.kozimor.wms.Database.Model.DTO.OrderStatusHistoryDTO;
import org.springframework.data.domain.Page;
import java.util.List;
import java.util.Optional;

public interface OrderService {
    OrderDTO createOrder(OrderDTO orderDTO, Long userId);
    Optional<OrderDTO> getOrderById(Long id);
    OrderDTO getOrderByNumber(String orderNumber);
    Page<OrderDTO> getOrdersPaginated(int page, int size);
    Page<OrderDTO> getOrdersByStatus(String status, int page, int size);
    Page<OrderDTO> getOrdersByUser(Long userId, int page, int size);
    OrderDTO updateOrderStatus(Long id, String newStatus, String changeReason, Long userId);
    void deleteOrder(Long id);
    long getOrderCount();
    List<OrderStatusHistoryDTO> getOrderStatusHistory(Long orderId);
}

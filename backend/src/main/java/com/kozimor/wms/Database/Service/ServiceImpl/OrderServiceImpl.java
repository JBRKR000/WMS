package com.kozimor.wms.Database.Service.ServiceImpl;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kozimor.wms.Database.Model.Order;
import com.kozimor.wms.Database.Model.OrderLine;
import com.kozimor.wms.Database.Model.OrderStatusHistory;
import com.kozimor.wms.Database.Model.TransactionStatus;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionType;
import com.kozimor.wms.Database.Model.InventoryLocation;
import com.kozimor.wms.Database.Model.DTO.OrderDTO;
import com.kozimor.wms.Database.Model.DTO.OrderLineDTO;
import com.kozimor.wms.Database.Model.DTO.OrderStatusHistoryDTO;
import com.kozimor.wms.Database.Repository.OrderRepository;
import com.kozimor.wms.Database.Repository.OrderLineRepository;
import com.kozimor.wms.Database.Repository.OrderStatusHistoryRepository;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.InventoryLocationRepository;
import com.kozimor.wms.Database.Service.OrderService;
import com.kozimor.wms.Database.Service.TransactionService;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderLineRepository orderLineRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final InventoryLocationRepository inventoryLocationRepository;
    private final TransactionService transactionService;

    public OrderServiceImpl(OrderRepository orderRepository,
                          OrderLineRepository orderLineRepository,
                          OrderStatusHistoryRepository orderStatusHistoryRepository,
                          UserRepository userRepository,
                          ItemRepository itemRepository,
                          InventoryLocationRepository inventoryLocationRepository,
                          TransactionService transactionService) {
        this.orderRepository = orderRepository;
        this.orderLineRepository = orderLineRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.inventoryLocationRepository = inventoryLocationRepository;
        this.transactionService = transactionService;
    }

    @Override
    public OrderDTO createOrder(OrderDTO orderDTO, Long userId) {
        // Walidacja
        if (orderDTO.getOrderLines() == null || orderDTO.getOrderLines().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one order line");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // Tworzenie zamówienia
        Order order = new Order();
        order.setOrderNumber(orderDTO.getOrderNumber());
        order.setOrderStatus(TransactionStatus.PENDING);
        order.setCreatedBy(user);
        order.setDescription(orderDTO.getDescription());

        Order savedOrder = orderRepository.save(order);

        // Tworzenie linii zamówienia i transakcji
        for (OrderLineDTO lineDTO : orderDTO.getOrderLines()) {
            Item item = itemRepository.findById(lineDTO.getItemId())
                    .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + lineDTO.getItemId()));

            OrderLine orderLine = new OrderLine();
            orderLine.setOrder(savedOrder);
            orderLine.setItem(item);
            orderLine.setQuantity(lineDTO.getQuantity());

            OrderLine savedOrderLine = orderLineRepository.save(orderLine);

            // Pobierz lokację itemu (musi być przypisana)
            java.util.List<InventoryLocation> itemLocations = inventoryLocationRepository.findAllByItem(item);
            if (itemLocations.isEmpty()) {
                throw new IllegalArgumentException("Item '" + item.getName() + "' nie ma przypisanej lokacji. Nie można utworzyć zamówienia.");
            }
            
            // Tworzenie transakcji do aktualizacji stanu produktu
            Transaction transaction = new Transaction();
            transaction.setTransactionType(TransactionType.ORDER);
            transaction.setItem(item);
            transaction.setQuantity(lineDTO.getQuantity());
            transaction.setUser(user);
            transaction.setTransactionStatus(TransactionStatus.PENDING);
            transaction.setDescription("Order #" + savedOrder.getOrderNumber());
            
            // Ustaw lokację (wybierz pierwszą/główną lokację itemu)
            transaction.setLocation(itemLocations.get(0).getLocation());

            // Używamy TransactionService które automatycznie aktualizuje ilość
            Transaction savedTransaction = transactionService.createTransaction(transaction);

            // Powiązanie OrderLine z Transaction
            savedOrderLine.setTransaction(savedTransaction);
            orderLineRepository.save(savedOrderLine);
        }

        // Tworzenie historii statusu - dla nowego zamówienia oldStatus = PENDING (initial status)
        OrderStatusHistory statusHistory = new OrderStatusHistory();
        statusHistory.setOrder(savedOrder);
        statusHistory.setOldStatus(TransactionStatus.PENDING); // Initial status
        statusHistory.setNewStatus(TransactionStatus.PENDING);
        statusHistory.setChangedBy(user);
        statusHistory.setChangeReason("Zamówienie utworzone");

        orderStatusHistoryRepository.save(statusHistory);

        return convertToDTO(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OrderDTO> getOrderById(Long id) {
        return orderRepository.findById(id).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with number: " + orderNumber));
        return convertToDTO(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDTO> getOrdersPaginated(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return orderRepository.findAll(pageable).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDTO> getOrdersByStatus(String status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        try {
            TransactionStatus transactionStatus = TransactionStatus.valueOf(status.toUpperCase());
            return orderRepository.findByOrderStatus(transactionStatus, pageable).map(this::convertToDTO);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + status);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDTO> getOrdersByUser(Long userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return orderRepository.findByCreatedById(userId, pageable).map(this::convertToDTO);
    }

    @Override
    public OrderDTO updateOrderStatus(Long id, String newStatus, String changeReason, Long userId) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        TransactionStatus oldStatus = order.getOrderStatus();
        TransactionStatus newTransactionStatus;

        try {
            newTransactionStatus = TransactionStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + newStatus);
        }

        order.setOrderStatus(newTransactionStatus);
        Order savedOrder = orderRepository.save(order);

        // Tworzenie wpisu w historii zmian
        OrderStatusHistory statusHistory = new OrderStatusHistory();
        statusHistory.setOrder(savedOrder);
        statusHistory.setOldStatus(oldStatus);
        statusHistory.setNewStatus(newTransactionStatus);
        statusHistory.setChangedBy(user);
        statusHistory.setChangeReason(changeReason != null ? changeReason : "Status zmieniony na: " + newStatus);

        orderStatusHistoryRepository.save(statusHistory);

        return convertToDTO(savedOrder);
    }

    @Override
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new EntityNotFoundException("Order not found with id: " + id);
        }
        // Kaskadowe usunięcie OrderLines i OrderStatusHistory
        orderRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long getOrderCount() {
        return orderRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderStatusHistoryDTO> getOrderStatusHistory(Long orderId) {
        List<OrderStatusHistory> history = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        return history.stream()
                .map(h -> new OrderStatusHistoryDTO(
                        h.getId(),
                        h.getOldStatus() != null ? h.getOldStatus().name() : null,
                        h.getNewStatus().name(),
                        h.getChangedBy() != null ? h.getChangedBy().getUsername() : null,
                        h.getChangeReason(),
                        h.getCreatedAt() != null ? h.getCreatedAt().format(formatter) : null
                ))
                .collect(Collectors.toList());
    }

    private OrderDTO convertToDTO(Order order) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        List<OrderLineDTO> orderLineDTOs = order.getOrderLines().stream()
                .map(ol -> new OrderLineDTO(
                        ol.getId(),
                        ol.getItem().getId(),
                        ol.getItem().getName(),
                        ol.getItem().getCategory() != null ? ol.getItem().getCategory().getName() : null,
                        ol.getQuantity(),
                        ol.getItem().getUnit().name(),
                        ol.getTransaction() != null ? ol.getTransaction().getId() : null
                ))
                .collect(Collectors.toList());

        return new OrderDTO(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderStatus().name(),
                order.getCreatedBy().getUsername(),
                order.getDescription(),
                order.getItemCount(),
                order.getTotalQuantity(),
                orderLineDTOs,
                order.getCreatedAt() != null ? order.getCreatedAt().format(formatter) : null,
                order.getUpdatedAt() != null ? order.getUpdatedAt().format(formatter) : null
        );
    }
}

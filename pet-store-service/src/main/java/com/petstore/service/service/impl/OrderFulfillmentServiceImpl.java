package com.petstore.service.service.impl;

import com.petstore.domain.dto.OrderCancelRequest;
import com.petstore.domain.dto.OrderItemResponseDTO;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.dto.OrderStatusUpdateRequest;
import com.petstore.domain.entity.AppUser;
import com.petstore.domain.entity.Order;
import com.petstore.domain.entity.OrderItem;
import com.petstore.domain.entity.Pet;
import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.CartItemType;
import com.petstore.domain.enums.OrderStatus;
import com.petstore.domain.enums.PaymentStatus;
import com.petstore.domain.enums.PetStatus;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.service.exception.InvalidStateTransitionException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.OrderRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.SupplyRepository;
import com.petstore.service.service.OrderFulfillmentService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class OrderFulfillmentServiceImpl implements OrderFulfillmentService {

    private static final Logger log = LoggerFactory.getLogger(OrderFulfillmentServiceImpl.class);

    private final OrderRepository orderRepository;
    private final PetRepository petRepository;
    private final SupplyRepository supplyRepository;

    public OrderFulfillmentServiceImpl(OrderRepository orderRepository,
                                       PetRepository petRepository,
                                       SupplyRepository supplyRepository) {
        this.orderRepository = orderRepository;
        this.petRepository = petRepository;
        this.supplyRepository = supplyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> getCustomerOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getCustomerOrderDetail(String orderNumber, Long userId) {
        Order order = orderRepository.findByOrderNumberAndUserIdWithItems(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found or access denied: " + orderNumber));
        return mapToDTO(order);
    }

    @Override
    public OrderResponseDTO cancelCustomerOrder(String orderNumber, Long userId, OrderCancelRequest request) {
        Order order = orderRepository.findByOrderNumberAndUserIdWithItems(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found or access denied: " + orderNumber));

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new InvalidStateTransitionException(
                    "Customer can only cancel orders in CONFIRMED state. Current status: " + order.getStatus());
        }

        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason().trim()
                : "Cancelled by customer self-service";

        rollbackInventoryAndRefund(order, reason);
        Order saved = orderRepository.save(order);
        log.info("Order {} successfully cancelled by customer {}", orderNumber, userId);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> getAdminOrders(String query, OrderStatus status, Pageable pageable) {
        Specification<Order> spec = (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Join<Order, AppUser> userJoin = root.join("user", JoinType.LEFT);

                Predicate orderNumMatch = cb.like(cb.lower(root.get("orderNumber")), pattern);
                Predicate recipientMatch = cb.like(cb.lower(root.get("recipientName")), pattern);
                Predicate trackingMatch = cb.like(cb.lower(root.get("trackingNumber")), pattern);
                Predicate emailMatch = cb.like(cb.lower(userJoin.get("email")), pattern);
                Predicate usernameMatch = cb.like(cb.lower(userJoin.get("username")), pattern);

                predicates.add(cb.or(orderNumMatch, recipientMatch, trackingMatch, emailMatch, usernameMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return orderRepository.findAll(spec, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getAdminOrderDetail(String orderNumber) {
        Order order = orderRepository.findByOrderNumberWithItems(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        return mapToDTO(order);
    }

    @Override
    public OrderResponseDTO updateOrderStatus(String orderNumber, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findByOrderNumberWithItems(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        OrderStatus current = order.getStatus();
        OrderStatus target = request.getStatus();

        if (current == target) {
            // Update tracking info if present
            updateTrackingMetadata(order, request);
            return mapToDTO(orderRepository.save(order));
        }

        if (current == OrderStatus.DELIVERED || current == OrderStatus.CANCELLED) {
            throw new InvalidStateTransitionException(
                    "Order " + orderNumber + " is in terminal state " + current + " and cannot transition to " + target);
        }

        // Validate state machine transitions
        boolean valid = switch (current) {
            case CONFIRMED -> (target == OrderStatus.PROCESSING || target == OrderStatus.CANCELLED);
            case PROCESSING -> (target == OrderStatus.SHIPPED || target == OrderStatus.CANCELLED);
            case SHIPPED -> (target == OrderStatus.DELIVERED || target == OrderStatus.CANCELLED);
            default -> false;
        };

        if (!valid) {
            throw new InvalidStateTransitionException(
                    "Cannot transition order from " + current + " to " + target);
        }

        switch (target) {
            case PROCESSING -> {
                order.setStatus(OrderStatus.PROCESSING);
            }
            case SHIPPED -> {
                order.setStatus(OrderStatus.SHIPPED);
                order.setShippedAt(Instant.now());
                updateTrackingMetadata(order, request);
            }
            case DELIVERED -> {
                order.setStatus(OrderStatus.DELIVERED);
                order.setDeliveredAt(Instant.now());
            }
            case CANCELLED -> {
                String reason = (request.getCancellationReason() != null && !request.getCancellationReason().isBlank())
                        ? request.getCancellationReason().trim()
                        : "Cancelled by administrator";
                rollbackInventoryAndRefund(order, reason);
            }
            default -> throw new InvalidStateTransitionException("Unsupported target status: " + target);
        }

        Order saved = orderRepository.save(order);
        log.info("Order {} transitioned from {} to {}", orderNumber, current, target);
        return mapToDTO(saved);
    }

    private void updateTrackingMetadata(Order order, OrderStatusUpdateRequest request) {
        if (request.getCarrier() != null && !request.getCarrier().isBlank()) {
            order.setCarrier(request.getCarrier().trim());
        }
        if (request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()) {
            order.setTrackingNumber(request.getTrackingNumber().trim());
        }
    }

    private void rollbackInventoryAndRefund(Order order, String reason) {
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        order.setCancelledAt(Instant.now());
        order.setCancellationReason(reason);

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getItemType() == CartItemType.PET && item.getPet() != null) {
                    Pet pet = item.getPet();
                    pet.setStatus(PetStatus.AVAILABLE);
                    petRepository.save(pet);
                    log.info("Restored pet ID {} ({}) to AVAILABLE status", pet.getId(), pet.getName());
                } else if (item.getItemType() == CartItemType.SUPPLY && item.getSupply() != null) {
                    Supply supply = item.getSupply();
                    int restoredQty = supply.getStockQuantity() + item.getQuantity();
                    supply.setStockQuantity(restoredQty);
                    if (supply.getStatus() == SupplyStatus.OUT_OF_STOCK) {
                        supply.setStatus(SupplyStatus.ACTIVE);
                    }
                    supplyRepository.save(supply);
                    log.info("Restored supply SKU {} quantity to {}", supply.getSku(), restoredQty);
                }
            }
        }
    }

    private OrderResponseDTO mapToDTO(Order order) {
        List<OrderItemResponseDTO> itemDTOs = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                Long itemId = oi.getItemType() == CartItemType.PET
                        ? (oi.getPet() != null ? oi.getPet().getId() : null)
                        : (oi.getSupply() != null ? oi.getSupply().getId() : null);

                itemDTOs.add(new OrderItemResponseDTO(
                        oi.getId(),
                        oi.getItemType(),
                        itemId,
                        oi.getTitle(),
                        oi.getSubtitle(),
                        oi.getUnitPrice(),
                        oi.getQuantity(),
                        oi.getSubtotal(),
                        oi.getPhotoUrl()
                ));
            }
        }

        return new OrderResponseDTO(
                order.getOrderNumber(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getTransactionId(),
                order.getCardBrand(),
                order.getCardLastFour(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getShippingAmount(),
                order.getTotalAmount(),
                order.getRecipientName(),
                order.getRecipientPhone(),
                order.getShippingAddressLine1(),
                order.getShippingAddressLine2(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPostalCode(),
                order.getShippingCountry(),
                itemDTOs,
                order.getCreatedAt(),
                order.getCarrier(),
                order.getTrackingNumber(),
                order.getCancellationReason(),
                order.getCancelledAt(),
                order.getShippedAt(),
                order.getDeliveredAt()
        );
    }
}

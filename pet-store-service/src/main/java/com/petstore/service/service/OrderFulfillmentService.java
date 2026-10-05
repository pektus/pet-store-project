package com.petstore.service.service;

import com.petstore.domain.dto.OrderCancelRequest;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.dto.OrderStatusUpdateRequest;
import com.petstore.domain.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderFulfillmentService {

    // Customer operations
    Page<OrderResponseDTO> getCustomerOrders(Long userId, Pageable pageable);

    OrderResponseDTO getCustomerOrderDetail(String orderNumber, Long userId);

    OrderResponseDTO cancelCustomerOrder(String orderNumber, Long userId, OrderCancelRequest request);

    // Administrator operations
    Page<OrderResponseDTO> getAdminOrders(String query, OrderStatus status, Pageable pageable);

    OrderResponseDTO getAdminOrderDetail(String orderNumber);

    OrderResponseDTO updateOrderStatus(String orderNumber, OrderStatusUpdateRequest request);
}

package com.petstore.web.controller;

import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.dto.OrderStatusUpdateRequest;
import com.petstore.domain.enums.OrderStatus;
import com.petstore.service.service.OrderFulfillmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderFulfillmentService fulfillmentService;

    public AdminOrderController(OrderFulfillmentService fulfillmentService) {
        this.fulfillmentService = fulfillmentService;
    }

    @GetMapping
    public ResponseEntity<Page<OrderResponseDTO>> getAdminOrders(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponseDTO> orders = fulfillmentService.getAdminOrders(query, status, pageable);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderResponseDTO> getAdminOrderDetail(@PathVariable String orderNumber) {
        OrderResponseDTO order = fulfillmentService.getAdminOrderDetail(orderNumber);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderNumber}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @PathVariable String orderNumber,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderResponseDTO updated = fulfillmentService.updateOrderStatus(orderNumber, request);
        return ResponseEntity.ok(updated);
    }
}

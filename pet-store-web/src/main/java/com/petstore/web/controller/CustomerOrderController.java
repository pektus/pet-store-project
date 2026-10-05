package com.petstore.web.controller;

import com.petstore.domain.dto.OrderCancelRequest;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.entity.AppUser;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.UserRepository;
import com.petstore.service.service.OrderFulfillmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/customer/orders")
public class CustomerOrderController {

    private final OrderFulfillmentService fulfillmentService;
    private final UserRepository userRepository;

    public CustomerOrderController(OrderFulfillmentService fulfillmentService, UserRepository userRepository) {
        this.fulfillmentService = fulfillmentService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Page<OrderResponseDTO>> getMyOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AppUser user = resolveUser(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponseDTO> orders = fulfillmentService.getCustomerOrders(user.getId(), pageable);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderResponseDTO> getMyOrderDetail(
            @PathVariable String orderNumber,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AppUser user = resolveUser(principal);
        OrderResponseDTO order = fulfillmentService.getCustomerOrderDetail(orderNumber, user.getId());
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{orderNumber}/cancel")
    public ResponseEntity<OrderResponseDTO> cancelMyOrder(
            @PathVariable String orderNumber,
            @RequestBody(required = false) OrderCancelRequest request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AppUser user = resolveUser(principal);
        OrderResponseDTO cancelled = fulfillmentService.cancelCustomerOrder(orderNumber, user.getId(), request);
        return ResponseEntity.ok(cancelled);
    }

    private AppUser resolveUser(Principal principal) {
        return userRepository.findByUsernameOrEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found: " + principal.getName()));
    }
}
